
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Analysis function called');
    
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let user = null;
    
    // Try to authenticate if header present, but don't fail if it doesn't work
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: authError } = await supabase.auth.getUser(token);
        if (userData?.user && !authError) {
          user = userData.user;
          console.log('User authenticated:', user.id);
        } else {
          console.log('Auth failed, proceeding without user:', authError?.message);
        }
      } catch (authErr) {
        console.log('Auth error, proceeding without user:', authErr);
      }
    } else {
      console.log('No auth header, proceeding without user');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    const { testType, response, prompt, imageUrl, isPremium = false, batchData, sessionId, timeTaken, totalQuestions, completedQuestions } = await req.json();

    // If sessionId is provided and user is authenticated, verify user owns this session
    if (sessionId && user) {
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session || session.user_id !== user.id) {
        console.log('Session verification failed:', sessionError?.message);
        return new Response(
          JSON.stringify({ error: 'Unauthorized access to session' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Handle batch analysis
    if (testType.includes('_batch')) {
      return await handleBatchAnalysis(testType, batchData, isPremium, openaiApiKey);
    }

    const systemPrompt = getSystemPrompt(testType, isPremium);
    const userPrompt = getUserPrompt(testType, response, prompt, timeTaken, totalQuestions, completedQuestions);

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Check if this is an uploaded handwritten response
    let isUploadedResponse = false;
    let actualImageUrl = imageUrl;
    
    // Try to parse response as JSON to check for uploaded image
    try {
      const parsed = JSON.parse(response);
      if (parsed.mode === 'uploaded' && parsed.imageUrl) {
        isUploadedResponse = true;
        actualImageUrl = parsed.imageUrl;
        console.log('DEBUG - Detected uploaded image from JSON:', actualImageUrl);
      }
    } catch (e) {
      // Not JSON, check if it's the placeholder text
      if (response.trim() === 'User uploaded handwritten response' || 
          response.toLowerCase().includes('uploaded')) {
        isUploadedResponse = true;
      }
    }
    
    console.log('DEBUG - Response text:', response);
    console.log('DEBUG - Is uploaded response:', isUploadedResponse);
    console.log('DEBUG - Image URL:', actualImageUrl);

    // Add image for vision tasks (TAT/PPDT) or uploaded handwritten responses
    if (actualImageUrl && (testType === 'ppdt' || testType === 'tat' || isUploadedResponse)) {
      // If it's an uploaded handwritten response, we need to extract text first
      if (isUploadedResponse) {
        console.log('DEBUG - Using OCR mode for uploaded handwritten response');
        messages[1].content = [
          { 
            type: 'text', 
            text: `IMPORTANT: This is a handwritten response uploaded by the user. First, carefully read and extract ALL the text from the image. Then evaluate it using the PPDT structure.

The image contains the user's handwritten PPDT response. Read every word carefully, including any corrections or additions.

After extracting the text, evaluate it against the PPDT criteria (WHO, WHAT, HOW, SO WHAT).

${userPrompt}` 
          },
          { type: 'image_url', image_url: { url: actualImageUrl, detail: 'high' } }
        ];
      } else {
        console.log('DEBUG - Using regular vision mode for test image');
        // Regular vision task (test image, not response image)
        messages[1].content = [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: actualImageUrl } }
        ];
      }
    }

    const startTime = Date.now();
    
    // Use gpt-4o for uploaded handwritten responses (better OCR), gpt-4o-mini for typed responses
    const modelToUse = isUploadedResponse ? 'gpt-4o' : 'gpt-4o-mini';
    
    // Add timeout for OpenAI API call (45 seconds for uploaded images, 30 for typed)
    const controller = new AbortController();
    const timeoutMs = isUploadedResponse ? 45000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          temperature: 0.2,
          max_tokens: 3500,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      let data;
      let logEventType = 'success';
      let errorCode = null;
      let errorMessage = null;
      let tokensUsed = 0;

      if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      errorCode = apiResponse.status.toString();
      errorMessage = errorData.error?.message || apiResponse.statusText;
      
      // Determine error type based on status code
      if (apiResponse.status === 429) {
        logEventType = 'rate_limit';
      } else if (apiResponse.status === 402 || (errorMessage && errorMessage.toLowerCase().includes('quota'))) {
        logEventType = 'quota_exceeded';
      } else {
        logEventType = 'error';
      }

      // Log the API error
      await logOpenAIUsage({
        supabase,
        eventType: logEventType,
        errorCode,
        errorMessage,
        requestType: testType,
        responseTime,
        modelUsed: 'gpt-4o-mini',
        isPremium
      });

        throw new Error(`OpenAI API request failed: ${errorMessage}`);
      }

      data = await apiResponse.json();
      tokensUsed = data.usage?.total_tokens || 0;

      // Log successful API call
      await logOpenAIUsage({
        supabase,
        eventType: 'success',
        requestType: testType,
        tokensUsed,
        responseTime,
        modelUsed: modelToUse,
        isPremium,
        metadata: isUploadedResponse ? { uploadedImage: true } : {}
      });
      const analysis = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify(formatFeedback(analysis, isPremium)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError') {
        console.error('OpenAI API request timeout');
        await logOpenAIUsage({
          supabase,
          eventType: 'error',
          errorCode: '408',
          errorMessage: 'Request timeout',
          requestType: testType,
          responseTime: Date.now() - startTime,
          modelUsed: 'gpt-4o-mini',
          isPremium
        });
        throw new Error('Request timeout - image processing took too long');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return new Response(JSON.stringify(getFallbackFeedback()), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

const SSB_TRAITS = [
  'Leadership',
  'Initiative', 
  'Communication',
  'Problem Solving',
  'Teamwork',
  'Decision Making',
  'Emotional Stability',
  'Confidence',
  'Responsibility',
  'Adaptability',
  'Planning',
  'Courage',
  'Determination',
  'Social Skills',
  'Intelligence',
  'Effective Intelligence',
  'Reasoning Ability',
  'Cooperation',
  'Liveliness',
  'Team Spirit'
];

function getSystemPrompt(testType: string, isPremium: boolean): string {
  const basePrompt = `You are a highly experienced SSB (Services Selection Board) psychologist with 15+ years of experience in military officer selection. You conduct rigorous psychological assessments that determine a candidate's suitability for military leadership positions.

ROLE: Senior Military Psychologist & Selection Expert
TASK: Conduct a comprehensive evaluation of Officer Like Qualities (OLQs)
STANDARD: Professional military assessment standards

CRITICAL: Your analysis MUST explicitly connect the STIMULUS (image/word/situation shown) with the RESPONSE (what the candidate wrote). 

Every piece of feedback should reference:
1. What the stimulus demanded/expected
2. How the candidate's response addressed or missed those demands
3. Specific recommendations based on the gap between stimulus requirements and actual response

The 15 traits you MUST evaluate: ${SSB_TRAITS.join(', ')}.

ASSESSMENT PHILOSOPHY:
- ALWAYS reference the specific stimulus when analyzing the response
- Explain how the response does or doesn't fit the situation/word/image
- Point out missed opportunities specific to THIS stimulus
- Give recommendations that are contextual to what was actually shown
- Recognize genuine effort and positive qualities in responses
- Provide constructive feedback that encourages development

CRITICAL SCORING CRITERIA - BE STRICT:
- 1-2/10: Gibberish, random keystrokes, completely irrelevant content, or inappropriate responses
  * Example: "asdfasdf", "zzz", "random text", nonsensical words
  * Random handwritten notes unrelated to the stimulus
  * No coherent thought or connection to the task
- 3-4/10: Minimal effort, extremely poor quality, vague or one-word responses
  * Shows no understanding of what the stimulus demanded
  * Copied the situation without adding any solution
  * Very short responses with no depth
- 5-6/10: Below average to average responses with weak stimulus connection
  * Some effort shown but lacks substance or depth
  * Partial understanding but misses key elements
  * Generic responses that could apply to any situation
- 7-8/10: Good responses clearly addressing the stimulus with officer-like thinking
  * Demonstrates clear understanding and appropriate response
  * Shows leadership qualities and practical solutions
  * Well-structured with proper reasoning
- 9-10/10: Exceptional responses deeply engaging with the stimulus
  * Outstanding leadership demonstration
  * Innovative and practical solutions
  * Mature, professional, and comprehensive approach

VALIDATION RULES - ALWAYS CHECK FIRST:
1. Is the response actual gibberish or random characters? → Score 1-2
2. Is it completely unrelated to the stimulus? → Score 1-2
3. Is it extremely short (1-3 words) with no meaning? → Score 2-3
4. Does it show ANY effort to understand the task? → Minimum score 4
5. Only give 7+ if response is genuinely good quality

STIMULUS-RESPONSE CONNECTION INDICATORS:
- Does the response directly address what the stimulus presented?
- Are situational demands properly identified and tackled?
- Does the response show understanding of context/nuances in the stimulus?
- Is the response appropriate for the specific scenario given?

You must respond with valid JSON format only.`;
  
  if (isPremium) {
    return `${basePrompt}
    
    Analyze the ${testType.toUpperCase()} response against all 15 traits.
    
    CRITICAL: In EVERY field of feedback, explicitly mention:
    - The specific stimulus (image/word/situation) that was presented
    - How the candidate's response addressed or failed to address it
    - What the stimulus specifically demanded that was or wasn't delivered
    
    For each trait, provide:
    - Score (1-10) with justification referencing the stimulus-response connection
    - Specific evidence from the response in context of what was shown
    - Areas for improvement with advice specific to THIS stimulus
    
    In strengths: "For [this situation/word/image], you demonstrated..."
    In improvements: "Given [this situation/word/image], you could have..."
    In recommendations: "When facing [similar situations], focus on..."
    In officer qualities: "Your response to [this scenario] showed..."
    In sample response: Write it specifically for the EXACT stimulus given
    
    ${testType === 'ppdt' ? `
    FOR PPDT: Include component breakdown in improvements array:
    - First item: "WHO (Character) - X/2 points: [analysis with what's missing]"
    - Second item: "WHAT (Problem) - X/2 points: [analysis with what's missing]"
    - Third item: "HOW (Actions) - X/4 points ⚠️ CRITICAL: [count actions, list missing elements]"
    - Fourth item: "SO WHAT (Outcome) - X/2 points: [analysis with what's missing]"
    - Then add 2-3 general improvement points
    ` : ''}
    
     Return comprehensive analysis as JSON:
     {
       "overallScore": 7,
       "traitScores": [{"trait": "Leadership", "score": 8, "description": "Given the [situation], your response showed... You could improve by..."}],
       "strengths": ["For this particular [image/word/situation], you effectively demonstrated [quality] by [evidence]"],
       "improvements": ["The situation demanded [X], but your response focused on [Y]. Consider [specific advice for THIS scenario]"],
       "recommendations": ["When facing similar [type of situations], remember to [contextual advice based on what was shown]"],
       "officerLikeQualities": ["Your handling of [this specific scenario] revealed [quality with evidence]"],
       "sampleResponse": "A professionally written example response specifically for THIS exact stimulus/situation/word/image. ${testType === 'ppdt' ? 'Format with clear sections: [WHO] name, age, designation, location. [WHAT] problem/opportunity at specific location. [HOW] minimum 5-6 specific actions with authorities, resources, timeline, numbers. [SO WHAT] outcome with beneficiaries and measurable impact.' : ''}"
     }`;
  } else {
    return `${basePrompt}
    
    Provide a professional basic assessment focusing on how well the response addressed the specific stimulus.
    
    IMPORTANT: Reference the actual stimulus (image/word/situation) in your feedback.
    
    Return analysis as JSON:
    {
      "overallScore": 6,
      "traitScores": [],
      "strengths": ["For this [situation/word/image], you showed [quality with brief evidence]"],
      "improvements": ["This [scenario] required [X], but your response [Y]. Try [specific advice]", "Given this [context], you missed [opportunity]"],
      "recommendations": ["For scenarios like this [type], focus on [contextual advice]", "Upgrade to premium for detailed 15-trait analysis"],
      "officerLikeQualities": ["In response to this [scenario], you demonstrated [quality]"],
      "sampleResponse": "A sample ideal response specifically addressing THIS exact stimulus"
    }`;
  }
}

function getUserPrompt(testType: string, response: string, prompt?: string, timeTaken?: number, totalQuestions?: number, completedQuestions?: number): string {
  let userPrompt = `TEST TYPE: ${testType.toUpperCase()}\n\n`;
  
  userPrompt += `=== STIMULUS PRESENTED TO CANDIDATE ===\n`;
  if (prompt) {
    userPrompt += `${prompt}\n`;
  } else {
    userPrompt += `[Stimulus details not provided]\n`;
  }
  userPrompt += `\n=== CANDIDATE'S RESPONSE ===\n"${response}"\n`;
  
  // Add timing and completion data for comprehensive analysis
  if (timeTaken !== undefined) {
    userPrompt += `TIME TAKEN: ${timeTaken} seconds\n`;
  }
  if (totalQuestions !== undefined && completedQuestions !== undefined) {
    userPrompt += `COMPLETION RATE: ${completedQuestions}/${totalQuestions} questions (${Math.round((completedQuestions/totalQuestions) * 100)}%)\n`;
  }
  userPrompt += `\n`;
  
  switch (testType) {
    case 'tat':
      userPrompt += `\nTAT EVALUATION - STIMULUS-RESPONSE CONNECTION:

CRITICAL: Analyze how well the response relates to the SPECIFIC image/situation shown above.

Your analysis MUST address:
1. How does the story interpret the given image/situation?
2. Did the candidate understand what the image was depicting?
3. Does the story flow logically from what's shown in the image?
4. What elements of the image were addressed or ignored?

IMPORTANT: If an image is provided, it may contain handwritten response. Read carefully and analyze.

CRITICAL VALIDATION (MUST CHECK FIRST):
1. Is the response complete gibberish or random keystrokes? (e.g., "asdfgh", "zzz", random letters)
2. Is it completely unrelated to the TAT image? (e.g., shopping list, random notes)
3. Is it extremely short with no coherent story? (e.g., single word, fragment)
4. Does it show zero understanding of the TAT task?
→ If YES to any: Score 1-2/10 immediately

STORY STRUCTURE (25%):
- Does the story have beginning, middle, end that fits the image context?
- Are characters and their actions consistent with what the image suggests?
- Is the conflict appropriate to the situation depicted?

LEADERSHIP QUALITIES (35%):
- Given THIS situation in the image, did the response show initiative?
- Was the problem-solving appropriate for THIS specific context?
- Did the approach match what the situation demanded?

PSYCHOLOGICAL MATURITY (25%):
- Is the interpretation of the image realistic and mature?
- Does the candidate understand the gravity/nature of the situation shown?

COMMUNICATION (15%):
- Is the story clearly connected to the image/situation?
- Are values demonstrated relevant to the context?

For uploaded handwritten responses: Evaluate presentation and professionalism.

REMEMBER: Every piece of feedback must reference "In this image/situation..." or "Given this scenario..."`;
      break;
    case 'wat':
      userPrompt += `\nWAT EVALUATION - WORD-ASSOCIATION CONNECTION:

CRITICAL: Analyze the association in context of the SPECIFIC WORD shown above.

VALIDATION CHECK FIRST:
1. Is the response random characters or gibberish? → Score 1/10
2. Is it completely unrelated to the word? → Score 1-2/10
3. Is there NO logical connection whatsoever? → Score 2-3/10
→ Only proceed with normal evaluation if response shows genuine attempt

Your analysis MUST address:
1. Is the association logically/semantically connected to THIS word?
2. What does this particular association reveal about thinking patterns?
3. Was there a more officer-like association possible for THIS word?
4. How appropriate is this specific pairing (word → response)?

MENTAL ASSOCIATIONS (40%):
- For THIS particular word, is the association positive or negative?
- Given THIS word, was the response appropriately quick and relevant?
- Does this association show officer-like thinking for THIS context?

EMOTIONAL STABILITY (30%):
- Given THIS word's nature, is the emotional response balanced?
- Does the association show maturity given what THIS word typically evokes?

LEADERSHIP MINDSET (20%):
- For THIS word, did the candidate choose an action-oriented association?
- Could THIS word have triggered a more leadership-focused response?

VALUES (10%):
- Given THIS word, does the association reflect good values?
- What does this specific pairing reveal about character?

REMEMBER: Always say "For the word '[word]', your association '[response]' shows..."`;
      break;
    case 'srt':
      userPrompt += `\nSRT EVALUATION - SITUATION-RESPONSE ALIGNMENT:

CRITICAL: Evaluate how well the response addresses the SPECIFIC SITUATION described above.

VALIDATION CHECK FIRST:
1. Is this gibberish, random text, or nonsense? → Score 1/10
2. Is the response just repeating the situation without solution? → Score 2-3/10
3. Is it extremely vague or generic with no specifics? → Score 3-4/10
4. Is it totally unrelated to the given situation? → Score 1-2/10
→ BE STRICT: Only good responses deserve 7+ scores

Your analysis MUST address:
1. Did the candidate correctly identify what THIS situation demanded?
2. Is the solution appropriate for THIS specific problem?
3. What did THIS situation require that was or wasn't addressed?
4. How realistic is the proposed solution for THIS exact context?

1. PROBLEM UNDERSTANDING:
   - Does the response show clear understanding of THIS specific situation?
   - Are the unique challenges of THIS scenario properly identified?
   - What contextual factors of THIS situation were considered or missed?

2. LEADERSHIP INITIATIVE:
   - Given THIS situation, did the response show appropriate initiative?
   - Is the level of responsibility taken suitable for THIS scenario?
   - Does the approach match what THIS situation demands?

3. PRACTICAL SOLUTIONS:
   - Are the proposed solutions realistic for THIS specific context?
   - Do the steps make sense given THIS exact situation?
   - Are resources and constraints of THIS scenario properly considered?

4. EXECUTION FOCUS:
   - Does the response show ownership appropriate to THIS situation?
   - Is the commitment level suitable for THIS particular challenge?

${timeTaken ? `Response Time: ${timeTaken}s - Consider if speed affected understanding of the situation` : ''}
${completedQuestions && totalQuestions ? `Completion: ${completedQuestions}/${totalQuestions} - Factor in sustained focus` : ''}

REMEMBER: Every feedback point must reference "In this situation where [X]..." or "Given that the problem was [Y]..."`;
      break;
    case 'ppdt':
      userPrompt += `\nPPDT EVALUATION - STRUCTURED 4-STEP ANALYSIS:

CRITICAL: PPDT is NOT creative writing - it's about showing PLANNING and EXECUTION ability.
Evaluate based on the SSB 4-STEP STRUCTURE: WHO → WHAT → HOW → SO WHAT

IMPORTANT: If an image is provided, it may contain handwritten response. Read carefully and analyze the content.

=== VALIDATION CHECK FIRST ===
1. Is the response gibberish or random text? → Score 1/10
2. Is it completely irrelevant to the PPDT task? → Score 1-2/10
3. Does it show zero understanding of the image/task? → Score 2-3/10
4. Is it just describing the image without a story? → Score 3-4/10
→ Only proceed with structured evaluation if response shows genuine attempt

=== PPDT SCORING RUBRIC (Total: 10 points) ===

**STEP 1: WHO? (Character Setup) - 2 points**
Check for:
✅ Specific name used (Rahul, Amit, Priya) - NOT "the boy", "the man", "someone"
✅ Age mentioned (25 years, 28 years)
✅ Designation/Role specified (SDM, engineer, teacher, intern, officer)
✅ Location mentioned (posted in Thoubal Manipur, working in Leh, at resort in Goa)

Score 2/2: All 4 elements present with specifics
Score 1/2: 2-3 elements present
Score 0/2: Generic character or missing details

**STEP 2: WHAT? (Problem/Opportunity) - 2 points**
Check for:
✅ Clear problem or opportunity identified
✅ Specific location mentioned (between villages X and Y, at river Z, on road from A to B)
✅ Realistic scenario (something an officer/professional would encounter)
✅ Positive framing (opportunity to help, not crime/violence/negative themes)

Score 2/2: Problem clearly stated with specific location and positive framing
Score 1/2: Problem identified but vague or missing location
Score 0/2: No clear problem or negative/unrealistic scenario

**STEP 3: HOW? (Actions - MOST CRITICAL) - 4 points**
This is where candidates WIN or LOSE. Check for:
✅ Minimum 5-6 SPECIFIC actions (not vague "he tried", "he worked hard")
✅ Authorities/departments contacted (forest dept, district collector, contractors, local authorities)
✅ Resources arranged (materials, workers, budget, equipment)
✅ Timeline mentioned (completed in 3 months, within 2 weeks, by next month)
✅ Specific features/details (ferry services, 20 meters apart, 15 lakhs cost, 50 people)
✅ Supervision/monitoring shown (personally checked, conducted inspections)

Score 4/4: 6+ specific actions with authorities, resources, timeline, and numbers
Score 3/4: 4-5 specific actions with some details
Score 2/4: 2-3 actions but mostly vague
Score 1/4: Only 1-2 vague actions like "he tried" or "he worked"
Score 0/4: No concrete actions, just thoughts or feelings

**STEP 4: SO WHAT? (Outcome) - 2 points**
Check for:
✅ Clear positive result stated
✅ Who benefited mentioned (people, villagers, students, community)
✅ Measurable impact (numbers, time saved, cost, ratings)
✅ Realistic outcome (not superhero achievements)

Score 2/2: Clear outcome with beneficiaries and measurable impact
Score 1/2: Outcome mentioned but vague or no numbers
Score 0/2: No outcome or unrealistic result

=== ANALYSIS INSTRUCTIONS ===

1. **Analyze each component separately** and assign points
2. **Count the actual number of specific actions** in the HOW section
3. **Identify what's missing** from each step
4. **Provide specific examples** of what should have been included
5. **Reference the actual image/scenario** throughout your feedback

=== SAMPLE RESPONSE FORMAT ===
Your sample response MUST follow this exact structure for THIS specific image:

[WHO - Character Setup]
[Name], [Age] years, [Designation], [Location]

[WHAT - Problem/Opportunity]  
While [doing what], he/she noticed/saw [specific problem/opportunity] at [exact location between X and Y]

[HOW - Specific Actions - MINIMUM 5-6 ACTIONS]
He/she immediately [ACTION 1 - contacted whom], [ACTION 2 - arranged what resources], [ACTION 3 - planned what specific features with numbers], [ACTION 4 - set what timeline], [ACTION 5 - supervised how], and [ACTION 6 - additional specific detail]

[SO WHAT - Outcome]
[What changed], [who benefited], [measurable impact with numbers]. [Positive reaction from people]

=== FEEDBACK STRUCTURE ===

Provide feedback in this format:

**Component Analysis:**

WHO (Character) - X/2 points
[List what was present and what was missing with specific examples]

WHAT (Problem/Opportunity) - X/2 points  
[List what was present and what was missing with specific examples]

HOW (Actions) - X/4 points ⚠️ MOST IMPORTANT
[Count actual actions: "You provided only 2 actions, need minimum 5-6"]
[List missing elements: authorities, resources, timeline, numbers]
[Give specific examples of what should have been added]

SO WHAT (Outcome) - X/2 points
[List what was present and what was missing with specific examples]

**Critical Issues:**
- List 2-3 most important things missing
- Be specific about what to add

**Strengths:**
- Acknowledge any good elements present
- Be encouraging but honest

=== COMMON THEMES TO SUGGEST ===
If response is weak, suggest these safe themes:
- Infrastructure (bridges, roads, community centers)
- Social welfare (education, healthcare, sanitation)
- Disaster management (flood relief, rescue, rehabilitation)
- Government/Administration (SDM/Collector solving issues)
- Innovation/Development (new technology, improving systems)
- Environmental (plantation, river cleaning, water conservation)

=== SCORING GUIDELINES ===
1-2/10: Gibberish, irrelevant, or no structure
3-4/10: Basic attempt but missing most components
5-6/10: Has some structure but weak HOW section (less than 3 actions)
7-8/10: Good structure with 5+ specific actions and details
9-10/10: Excellent - all components with specific names, numbers, authorities, timeline

REMEMBER: 
- PPDT is about PLANNING (multiple steps) and EXECUTION (specific details)
- The HOW section is worth 40% - this is where most candidates fail
- Always reference the specific image/scenario in your feedback
- Provide actionable improvements with examples
- Be strict but constructive - help them improve`;
      break;
    default:
      userPrompt += `Evaluate this response for officer-like qualities, leadership potential, and psychological maturity. Score fairly based on actual content quality.`;
  }
  
  userPrompt += `

CRITICAL INSTRUCTIONS FOR YOUR ANALYSIS:
1. ALWAYS reference the specific stimulus (image/word/situation) in every piece of feedback
2. Explain how the response does or doesn't connect to what was actually shown
3. Point out what the stimulus specifically demanded and whether it was delivered
4. Give recommendations that are contextual - "For situations like this where [X], you should [Y]"
5. Provide specific evidence connecting stimulus to response
6. Score based on how well the response addresses the SPECIFIC stimulus given
7. In your sample response, write it specifically for THIS exact stimulus, not a generic example
8. Use phrases like: "Given this situation...", "For this word...", "In this image...", "This scenario required..."

Remember: Every strength, improvement, recommendation, and quality you mention MUST be tied back to the specific stimulus that was presented.`;
  
  return userPrompt;
}

// Helper function to log OpenAI API usage
async function logOpenAIUsage({
  supabase,
  eventType,
  errorCode = null,
  errorMessage = null,
  requestType,
  tokensUsed = 0,
  responseTime,
  modelUsed,
  isPremium = false,
  metadata = {}
}: {
  supabase: any;
  eventType: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  requestType: string;
  tokensUsed?: number;
  responseTime: number;
  modelUsed: string;
  isPremium?: boolean;
  metadata?: any;
}) {
  try {
    // Estimate cost based on model and tokens (approximate rates)
    const costPerToken = modelUsed === 'gpt-4o-mini' ? 0.00015 / 1000 : 0.002 / 1000; // per token
    const costEstimate = tokensUsed * costPerToken;

    await supabase
      .from('openai_api_logs')
      .insert({
        event_type: eventType,
        error_code: errorCode,
        error_message: errorMessage,
        request_type: requestType,
        tokens_used: tokensUsed,
        cost_estimate: costEstimate,
        response_time_ms: responseTime,
        model_used: modelUsed,
        is_premium_request: isPremium,
        metadata
      });
  } catch (logError) {
    console.error('Failed to log OpenAI usage:', logError);
    // Don't throw here as it's just logging
  }
}

function formatFeedback(analysis: any, isPremium: boolean): any {
  // Only use analysis if it exists and has valid data, otherwise return null
  if (!analysis || typeof analysis !== 'object') {
    return null;
  }

  return {
    overallScore: analysis.overallScore || analysis.overall_score || 0,
    traitScores: isPremium ? (analysis.traitScores || analysis.trait_scores || []) : [],
    strengths: analysis.strengths || [],
    improvements: analysis.improvements || analysis.areas_for_improvement || [],
    recommendations: analysis.recommendations || [],
    officerLikeQualities: analysis.officerLikeQualities || analysis.officer_like_qualities || [],
    sampleResponse: analysis.sampleResponse || analysis.sample_response || "",
    wordSuggestions: analysis.wordSuggestions || [],
    sampleExamples: analysis.sampleExamples || [],
  };
}

function getFallbackFeedback(): any {
  return {
    overallScore: 3,
    traitScores: [],
    strengths: ['You attempted to complete the test'],
    improvements: [
      'Response quality could not be properly evaluated due to technical issues',
      'Ensure responses are clear, relevant, and address the given stimulus',
      'Avoid random text or gibberish - write meaningful, thoughtful responses',
      'Take time to understand what each stimulus is asking before responding'
    ],
    recommendations: [
      'Review the requirements for each test type before attempting',
      'Practice writing structured, coherent responses',
      'Focus on demonstrating officer-like qualities through your answers',
      'Upgrade to premium for detailed analysis and better guidance'
    ],
    officerLikeQualities: ['Completion shows basic commitment to the process'],
    sampleResponse: "A good response requires: clear understanding of the stimulus, thoughtful analysis, practical solutions with proper reasoning, and demonstration of leadership qualities.",
  };
}

async function handleBatchAnalysis(testType: string, batchData: any[], isPremium: boolean, openaiApiKey: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    console.log(`Starting batch analysis for ${testType}, premium: ${isPremium}, items: ${batchData.length}`);
    
    let systemPrompt: string;
    let userPrompt: string;

    if (testType === 'tat_batch') {
      systemPrompt = getTATBatchSystemPrompt(isPremium);
      userPrompt = getTATBatchUserPrompt(batchData);
    } else if (testType === 'wat_batch') {
      systemPrompt = getWATBatchSystemPrompt(isPremium);
      userPrompt = getWATBatchUserPrompt(batchData);
    } else if (testType === 'srt_batch') {
      systemPrompt = getSRTBatchSystemPrompt(isPremium);
      userPrompt = getSRTBatchUserPrompt(batchData);
    } else {
      console.error(`Invalid batch test type: ${testType}`);
      throw new Error('Invalid batch test type');
    }

    console.log('Calling OpenAI API for batch analysis...');
    const startTime = Date.now();
    
    // Helper function to validate and optimize image URLs
    const validateAndOptimizeImageUrl = async (imageUrl: string): Promise<string | null> => {
      try {
        const url = new URL(imageUrl);
        
        // If it's a Supabase storage URL, add transform parameters
        if (url.hostname.includes('supabase')) {
          url.searchParams.set('width', '1024');
          url.searchParams.set('quality', '80');
          const optimizedUrl = url.toString();
          
          // Quick validation check with 5 second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const response = await fetch(optimizedUrl, { 
              method: 'HEAD',
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`Validated and optimized image: ${optimizedUrl}`);
              return optimizedUrl;
            } else {
              console.warn(`Image validation failed: ${response.status}`);
              return null;
            }
          } catch (error) {
            clearTimeout(timeoutId);
            console.warn(`Image pre-fetch failed:`, error.message);
            return null;
          }
        }
        
        return imageUrl;
      } catch (error) {
        console.error(`Error processing image URL:`, error);
        return null;
      }
    };
    
    // Prepare messages based on test type and whether images are involved
    let messages: any[] = [{ role: 'system', content: systemPrompt }];
    
    if (testType === 'tat_batch') {
      // For TAT batch, include images in the message content with validation
      const userMessage: any = { role: 'user', content: [] };
      
      // Add text prompt first
      userMessage.content.push({
        type: 'text',
        text: userPrompt
      });
      
      // Validate and add images for each TAT story
      const failedImageIndices: number[] = [];
      for (let index = 0; index < batchData.length; index++) {
        const item = batchData[index];
        if (item.imageUrl && !item.isBlankSlide) {
          const imageUrl = item.imageUrl.trim();
          if (imageUrl.startsWith('http')) {
            const optimizedUrl = await validateAndOptimizeImageUrl(imageUrl);
            if (optimizedUrl) {
              userMessage.content.push({
                type: 'image_url',
                image_url: { 
                  url: optimizedUrl,
                  detail: "low" // Use low detail to reduce processing time and potential timeouts
                }
              });
              console.log(`Added image ${index + 1} to batch analysis`);
            } else {
              console.warn(`Image ${index + 1} failed validation, skipping`);
              failedImageIndices.push(index + 1);
            }
          } else {
            console.warn(`Invalid image URL format for item ${index + 1}`);
            failedImageIndices.push(index + 1);
          }
        }
      }
      
      // If too many images failed, use fallback
      if (failedImageIndices.length > batchData.length / 2) {
        console.error(`Too many images failed: ${failedImageIndices.length}/${batchData.length}`);
        return handleImageTimeoutFallback(isPremium, batchData, failedImageIndices);
      }
      
      if (failedImageIndices.length > 0) {
        console.warn(`${failedImageIndices.length} images could not be processed.`);
        userMessage.content[0].text += `\n\nNOTE: Images ${failedImageIndices.join(', ')} could not be loaded. Analyze based on available images and responses.`;
      }
      
      messages.push(userMessage);
    } else if (testType === 'wat_batch') {
      // For WAT batch, check if any responses have uploaded images
      const userMessage: any = { role: 'user', content: [] };
      
      // Add text prompt first
      userMessage.content.push({
        type: 'text',
        text: userPrompt
      });
      
      // Add images for WAT responses that were uploaded
      batchData.forEach((item, index) => {
        if (item.isUploadedImage && item.imageUrl) {
          try {
            const imageUrl = item.imageUrl.trim();
            if (imageUrl.startsWith('http')) {
              userMessage.content.push({
                type: 'image_url',
                image_url: { 
                  url: imageUrl,
                  detail: "high" // Use high detail for handwriting recognition
                }
              });
              console.log(`Added WAT response image ${index + 1} for word: ${item.word}`);
            }
          } catch (error) {
            console.error(`Error processing WAT image ${index + 1}:`, error);
          }
        }
      });
      
      messages.push(userMessage);
    } else {
      // For SRT and other text-only tests
      messages.push({ role: 'user', content: userPrompt });
    }
    
    // Add timeout for batch processing (50 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);
    
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.2,
          max_tokens: isPremium ? 4000 : 2000,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Batch analysis timeout - using fallback');
        return new Response(
          JSON.stringify(handleImageTimeoutFallback(isPremium, batchData, [])),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
      throw fetchError;
    }

    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.error?.message || response.statusText;
      } catch {
        errorText = await response.text();
      }
      
      console.error(`OpenAI API request failed: ${response.status} ${response.statusText}`, errorText);
      
      // Determine error type and log
      let logEventType = 'error';
      if (response.status === 429) {
        logEventType = 'rate_limit';
      } else if (response.status === 402 || (errorText && errorText.toLowerCase().includes('quota'))) {
        logEventType = 'quota_exceeded';
      } else if (errorText && (errorText.toLowerCase().includes('timeout') || errorText.toLowerCase().includes('downloading'))) {
        logEventType = 'timeout';
      }

      // Log batch API error using Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      
      await logOpenAIUsage({
        supabase: supabaseClient,
        eventType: logEventType,
        errorCode: response.status.toString(),
        errorMessage: errorText,
        requestType: testType,
        responseTime,
        modelUsed: 'gpt-4o-mini',
        isPremium
      });

      // For image timeout errors, provide a text-based analysis fallback
      if (logEventType === 'timeout' && testType === 'tat_batch') {
        console.log('Image timeout detected for TAT batch, providing text-based analysis fallback');
        return await handleImageTimeoutFallback(batchData, isPremium, corsHeaders);
      }

      throw new Error(`OpenAI API request failed: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, parsing content...');
    
    // Log successful batch API call
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    await logOpenAIUsage({
      supabase: supabaseClient,
      eventType: 'success',
      requestType: testType,
      tokensUsed: data.usage?.total_tokens || 0,
      responseTime,
      modelUsed: 'gpt-4o-mini',
      isPremium
    });
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid OpenAI response structure');
    }

    const content = data.choices[0].message.content;
    console.log('Raw OpenAI content:', content);
    
    let analysis;
    try {
      analysis = JSON.parse(content);
      console.log('Parsed analysis:', analysis);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError, 'Content:', content);
      throw new Error('Failed to parse analysis response');
    }

    const formattedFeedback = formatFeedback(analysis, isPremium);
    console.log('Formatted feedback:', formattedFeedback);

    return new Response(JSON.stringify(formattedFeedback), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Batch Analysis Error:', error);
    return new Response(JSON.stringify(getFallbackFeedback()), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function getTATBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are a professional psychologist specializing in SSB (Services Selection Board) psychological assessments. Analyze ALL TAT stories together to provide comprehensive evaluation.

Task: Analyze ${isPremium ? '13' : 'multiple'} TAT stories (12 pictures + 1 blank slide) and evaluate Officer Like Qualities.

The 19 SSB traits: ${SSB_TRAITS.join(', ')}.

TAT EVALUATION GUIDELINES:
The TAT assesses personality, thought process, and problem-solving abilities through ambiguous pictures.

STORY STRUCTURE (3-part format):
1. Beginning: Clear protagonist introduction with background and situation
2. Middle: Actions taken by protagonist to address the problem
3. End: Positive outcome/resolution highlighting protagonist's qualities

KEY EVALUATION CRITERIA:
✅ POSITIVE INDICATORS:
- Protagonist shows leadership, courage, empathy, problem-solving, teamwork
- Realistic and practical scenarios (avoid supernatural/overly dramatic elements)
- Positive endings showing growth, success, or solutions
- Protagonist takes initiative and motivates others
- Demonstrates logical problem-solving and resourcefulness
- Shows responsibility and determination

❌ NEGATIVE INDICATORS:
- Protagonist portrayed as helpless, overly emotional, or dependent
- Passive behavior or lack of initiative
- Negative or pessimistic outcomes
- Unrealistic or overly complex interpretations
- Superficial responses without depth
- Lack of clear action or resolution

SCORING APPROACH:
- Score 7-10: Strong leadership, clear problem-solving, positive outcomes, realistic approach
- Score 4-6: Moderate qualities, some positive traits but lacking depth or clarity
- Score 1-3: Passive responses, negative thinking, unrealistic scenarios, poor structure

Return comprehensive analysis as JSON.`;

  if (isPremium) {
    return `${basePrompt}

Return detailed analysis:
{
  "overallScore": number (1-10),
  "traitScores": [{"trait": "trait_name", "score": number, "description": "detailed analysis"}],
  "strengths": ["strength with evidence"],
  "improvements": ["area with advice"],
  "recommendations": ["development recommendation"],
  "officerLikeQualities": ["observed quality"],
  "sampleResponse": "Example of an ideal TAT story with proper structure",
  "storyFeedback": [{"storyNumber": number, "score": 1-10, "strengths": "what worked well", "improvements": "what could be better", "sampleStory": "example of improved version"}],
  "sampleExamples": [{"imageNumber": "actual_image_number", "response": "user_story", "analysis": "brief analysis"}]
}`;
  } else {
    return `${basePrompt}

Return basic analysis:
{
  "overallScore": number (1-10),
  "traitScores": [],
  "strengths": ["key strength"],
  "improvements": ["critical area"],
  "recommendations": ["Upgrade to premium for detailed analysis"],
  "officerLikeQualities": ["basic quality"],
  "sampleResponse": "Example story improvement",
  "sampleExamples": [{"imageNumber": "actual_image_number", "response": "user_story", "analysis": "brief analysis of this specific story"}]
}`;
  }
}

function getTATBatchUserPrompt(batchData: any[]): string {
  let prompt = "TAT BATCH ANALYSIS:\n\n";
  
  batchData.forEach((item, index) => {
    prompt += `Story ${item.imageNumber}${item.isBlankSlide ? ' (Blank Slide)' : ''}:\n`;
    if (item.imageUrl) {
      prompt += `Image: ${item.imageUrl}\n`;
    }
    prompt += `Prompt: ${item.prompt}\n`;
    prompt += `Response: "${item.response}"\n\n`;
  });

  prompt += `Analyze these ${batchData.length} TAT stories comprehensively. Look for patterns, consistency, and overall psychological profile across all responses.\n\n`;
  
  prompt += `Provide:\n`;
  prompt += `1. Overall psychological assessment based on all stories\n`;
  prompt += `2. Story-by-story feedback in "storyFeedback" array with:\n`;
  prompt += `   - storyNumber, score (1-10), strengths, improvements, sampleStory (improved version)\n`;
  prompt += `3. Pattern analysis (recurring themes, protagonist characteristics, problem-solving approaches)\n`;
  prompt += `4. Identify best stories that demonstrated strong OLQs\n`;
  prompt += `5. Common weaknesses to address (passive protagonists, negative endings, unrealistic scenarios)\n`;
  prompt += `6. Overall consistency and psychological profile\n\n`;
  
  prompt += `For sampleExamples, include 3-4 actual examples from the user's stories with brief analysis.`;
  
  return prompt;
}

function getWATBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are a professional psychologist specializing in SSB (Services Selection Board) psychological assessments. Analyze Word Association Test (WAT) responses to assess thought process, values, and officer suitability.

Task: Analyze 60 word associations to evaluate spontaneous thought patterns and Officer Like Qualities.

The 19 SSB traits: ${SSB_TRAITS.join(', ')}.

WAT EVALUATION GUIDELINES:
WAT provides quick insight into thought process, values, and suitability for officer role through immediate, spontaneous responses.

KEY EVALUATION CRITERIA:
✅ POSITIVE INDICATORS:
- Spontaneous, immediate responses (first thought that comes to mind)
- Positive and constructive tone showing optimism and determination
- Responses related to leadership qualities (challenge → opportunity, discipline → efficiency)
- Consistency showing stable and coherent thought process
- Values like integrity, commitment, duty, patriotism reflected
- Adaptability and resilience demonstrated
- Leadership traits: decisiveness, responsibility, initiative, positive influence
- Emotional intelligence and maturity
- Action-oriented and solution-focused responses
- Authentic, non-clichéd answers

❌ NEGATIVE INDICATORS:
- Negative or passive responses (e.g., "failed", "cried", "gave up")
- Overly philosophical or abstract answers lacking practicality
- Responses showing fear, indecisiveness, or lack of confidence
- Using "I am..." format (avoid first person "I")
- Clichéd or overused expressions
- Pessimistic or problem-focused associations
- Emotional instability or immaturity
- Dependent or helpless thinking patterns

SCORING APPROACH:
- Score 9-10: Complete sentences, highly positive, strong leadership/patriotism, action-oriented, no pronouns
- Score 7-8: Complete sentences, positive associations, shows OLQs, minor issues (passive voice)
- Score 5-6: Incomplete thoughts, philosophical/abstract, uses pronouns, lacks action
- Score 1-4: Negative, passive, inappropriate, or very weak associations

IMPORTANT SCORING RULES:
- Complete sentences with positive associations = minimum 7/10
- No pronouns (I/He/She) + positive = minimum 8/10
- Patriotic/leadership themes + complete sentence = 9-10/10
- Do NOT underscore good responses - reward quality appropriately

Analyze EACH response individually and score based on ACTUAL quality shown.`;

  if (isPremium) {
    return `${basePrompt}

You must respond with valid JSON format only:
{
  "overallScore": [score from 1-10 based on actual response quality],
  "traitScores": [{"trait": "Leadership", "score": [1-10], "description": "evidence from specific responses"}],
  "strengths": ["specific strength with examples from responses"],
  "improvements": ["Engagement in workshops focused on emotional intelligence."],
  "recommendations": ["Practice writing complete, positive sentences without using 'I', 'He', or 'She'."],
  "officerLikeQualities": ["observed OLQ with evidence"],
  "sampleResponse": "Word -> Short positive sentence (6-10 words, no pronouns, shows OLQs)",
  "wordSuggestions": [{"word": "EXACT_WORD_FROM_INPUT", "response": "EXACT_USER_RESPONSE", "betterResponse": "Improved 1-2 line sentence: positive, no pronouns, shows OLQs"}],
  "sampleExamples": [{"word": "EXACT_WORD", "response": "EXACT_RESPONSE", "analysis": "Why this works/doesn't work"}]
}`;
  } else {
    return `${basePrompt}

You must respond with valid JSON format only:
{
  "overallScore": [score from 1-10],
  "traitScores": [],
  "strengths": ["key strength"],
  "improvements": ["Avoid using 'I', 'He', 'She' in responses."],
  "recommendations": ["Practice writing complete, positive sentences."],
  "officerLikeQualities": ["main OLQ observed"],
  "sampleResponse": "Word -> Short positive sentence (6-10 words, no pronouns)",
  "wordSuggestions": [{"word": "EXACT_WORD", "response": "EXACT_RESPONSE", "betterResponse": "Improved sentence"}],
  "sampleExamples": [{"word": "EXACT_WORD", "response": "EXACT_RESPONSE", "analysis": "brief feedback"}]
}`;
  }
}

function getWATBatchUserPrompt(batchData: any[]): string {
  let prompt = "WORD ASSOCIATION TEST ANALYSIS:\n\n";
  
  let hasUploadedImages = false;
  batchData.forEach((item, index) => {
    if (item.isUploadedImage) {
      hasUploadedImages = true;
      prompt += `${index + 1}. ${item.word} -> [Handwritten response - analyze from image]\n`;
    } else {
      prompt += `${index + 1}. ${item.word} -> "${item.response}"\n`;
    }
  });

  prompt += `\n\nCRITICAL INSTRUCTIONS:
1. Match EXACT word with EXACT response - do NOT mix up responses
2. In "wordSuggestions", use the EXACT word and EXACT response from above
3. Score based on ACTUAL content quality:
   - Complete sentences with positive associations = 7-10
   - Uses "I", "He", "She" or philosophical = 3-5
   - Negative or passive = 1-3
4. "betterResponse" must be:
   - SHORT: Maximum 8-10 words
   - NO pronouns (I, He, She)
   - Positive and action-oriented
   - Shows leadership/patriotism/problem-solving
   - Examples:
     * "Challenges build resilience and strength."
     * "Discipline ensures mission success."
     * "Teamwork achieves collective goals efficiently."
   - If user's response is already excellent (8+/10), keep betterResponse VERY similar or say "Already excellent - demonstrates [quality]"

5. Provide specific feedback for EACH response in "wordSuggestions"
6. Identify patterns: pronoun usage, sentence completeness, positivity ratio`;
  
  if (hasUploadedImages) {
    prompt += `\n\nNOTE: Some responses are handwritten. Read carefully and analyze content quality.`;
  }
  
  prompt += `\n\nProvide comprehensive analysis with word-by-word feedback in "wordSuggestions" array.`;
  
  return prompt;
}

function getSRTBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are a professional psychologist specializing in SSB (Services Selection Board) psychological assessments. Analyze Situation Reaction Test (SRT) responses to assess decision-making ability, presence of mind, emotional intelligence, and Officer Like Qualities under pressure.

Task: Analyze 60 situation responses to evaluate practical problem-solving and leadership approach.

The 19 SSB traits: ${SSB_TRAITS.join(', ')}.

SRT EVALUATION GUIDELINES:
SRT assesses decision-making ability, presence of mind, emotional intelligence, and officer-like qualities under pressure. Candidates must respond quickly and logically.

GENERAL PRINCIPLES:
✅ Be Practical and Logical - Responses should reflect realistic actions
✅ Show Responsibility and Initiative - Always take charge, avoid passive behavior
✅ Reflect OLQs - Demonstrate leadership, empathy, courage, discipline, problem-solving
✅ Be Concise and Clear - Short (1-2 lines), direct, action-oriented responses
✅ Face the Situation - Never ignore or avoid the problem, always provide solution

RESPONSE STRUCTURE:
Each response should answer:
1. What action will you take?
2. How will you resolve the issue?
3. What qualities are reflected?

KEY EVALUATION CRITERIA:
✅ POSITIVE INDICATORS:
- Immediate problem identification and assessment
- Practical, realistic solution approach
- Leadership initiative and taking charge
- Clear decision-making without hesitation
- Responsibility acceptance (not blaming others)
- Teamwork and cooperation when appropriate
- Risk assessment and management
- Action-oriented responses (doing something concrete)
- Positive outcomes focused on resolution
- Specific, actionable solutions with clear steps
- Demonstrates courage, empathy, and resourcefulness
- Shows presence of mind under pressure

❌ NEGATIVE INDICATORS:
- Passive responses (e.g., "I will wait", "I will do nothing")
- Overly emotional or dramatic reactions
- Responses showing fear, indecisiveness, or lack of initiative
- Long-winded or vague answers without clear action
- Escaping or avoiding the situation
- Blaming others or making excuses
- Impractical or unrealistic solutions
- Lack of responsibility or leadership
- Repetitive similar actions across different situations

SCORING APPROACH:
- Score 8-10: Immediate action, clear leadership, practical solutions, strong OLQs
- Score 5-7: Adequate responses with some initiative but lacking clarity or depth
- Score 1-4: Passive, vague, emotional, or impractical responses

${isPremium ? 'Provide detailed trait scoring with specific examples from responses.' : 'Provide basic assessment with key decision-making patterns.'}`;

  if (isPremium) {
    return `${basePrompt}

You must respond with valid JSON format only:
{
  "overallScore": [score 1-10 based on actual leadership demonstration],
  "traitScores": [{"trait": "Leadership", "score": [1-10], "description": "evidence from multiple responses"}],
  "strengths": ["specific strength with response examples"],
  "improvements": ["critical area with actionable development advice"],
  "recommendations": ["specific training recommendations based on patterns"],
  "officerLikeQualities": ["observed leadership qualities with evidence"],
  "sampleResponse": "Example of ideal SRT response demonstrating excellence",
  "sampleExamples": [{"situation": "actual_situation", "response": "user_response", "analysis": "brief analysis of this specific response"}]
}`;
  } else {
    return `${basePrompt}

You must respond with valid JSON format only:
{
  "overallScore": [score 1-10 based on actual leadership demonstration],
  "traitScores": [],
  "strengths": ["key leadership strength observed"],
  "improvements": ["most critical development area", "time management assessment"],
  "recommendations": ["Upgrade to premium for detailed trait analysis and personalized development plan"],
  "officerLikeQualities": ["primary leadership indicator"],
  "sampleResponse": "Example of improved SRT response",
  "sampleExamples": [{"situation": "actual_situation", "response": "user_response", "analysis": "brief analysis of this specific response"}]
}`;
  }
}

function getSRTBatchUserPrompt(batchData: any[]): string {
  let prompt = "SRT BATCH EVALUATION:\n\n";
  
  batchData.forEach((item, index) => {
    prompt += `SITUATION ${index + 1}:\n`;
    prompt += `Scenario: ${item.situation}\n`;
    prompt += `Response: "${item.response}"\n`;
    if (item.timeTaken) {
      prompt += `Response Time: ${item.timeTaken} seconds\n`;
    }
    prompt += `\n`;
  });

  const completionRate = batchData.length;
  const totalExpected = 60;
  
  prompt += `EVALUATION REQUIREMENTS:\n`;
  prompt += `- Completed: ${completionRate}/${totalExpected} situations\n`;
  prompt += `- Analyze leadership approach consistency\n`;
  prompt += `- Evaluate practical problem-solving quality\n`;
  prompt += `- Assess officer potential based on actual responses\n\n`;
  
  prompt += `Provide:\n`;
  prompt += `1. Overall assessment of decision-making ability and leadership approach\n`;
  prompt += `2. Situation-by-situation feedback in "situationSuggestions" array with format:\n`;
  prompt += `   [{"situation": "brief situation", "yourResponse": "response", "score": 1-10, "feedback": "analysis of response quality", "betterResponse": "improved response showing clear action, leadership, and OLQs"}]\n`;
  prompt += `3. Pattern analysis (initiative level, responsibility acceptance, practical thinking)\n`;
  prompt += `4. Identify best and weakest responses with specific examples\n`;
  prompt += `5. Common mistakes or repetitive patterns to avoid\n\n`;
  
  prompt += `For sampleExamples, include 3-4 actual examples from the user's responses with brief analysis.\n\n`;
  
  prompt += `IMPORTANT: Score fairly based on actual content quality. Well-structured responses with clear leadership thinking should score well (7-8/10).`;
  
  return prompt;
}

// Fallback function for image timeout errors in TAT batch analysis
async function handleImageTimeoutFallback(batchData: any[], isPremium: boolean, corsHeaders: any): Promise<Response> {
  console.log('Handling image timeout fallback for TAT analysis');
  
  // CRITICAL: Low score because we cannot verify uploaded image content
  const fallbackAnalysis = {
    overallScore: 3, // Cannot verify quality without seeing the images
    traitScores: isPremium ? [
      { trait: "Leadership", score: 3, description: "Unable to assess - image processing failed" },
      { trait: "Communication", score: 3, description: "Cannot verify handwritten content quality" },
      { trait: "Initiative", score: 3, description: "Completion shown but content unverifiable" }
    ] : [],
    strengths: [
      "You attempted to complete all TAT stories"
    ],
    improvements: [
      "Image uploads failed to process - cannot verify if content is relevant TAT material",
      "Ensure images are properly uploaded before submitting test",
      "Verify handwriting is clear and legible in uploaded photos",
      "Consider typing responses instead for more reliable analysis",
      "Double-check uploaded images contain actual TAT stories, not random notes"
    ],
    recommendations: isPremium ? [
      "Retake the TAT test with verified image uploads or typed responses",
      "Upload images immediately after writing to avoid timeout issues",
      "Test image quality before starting - ensure photos are clear and readable",
      "Focus on writing coherent stories that address the specific TAT images shown",
      "Practice proper TAT story structure: beginning, middle, end with leadership themes"
    ] : [
      "Retake test with verified uploads or type responses",
      "Ensure images upload successfully before submission",
      "Upgrade to premium for detailed support"
    ],
    officerLikeQualities: [
      "Test completion shows basic commitment"
    ],
    sampleResponse: "In this situation, I see a leader taking initiative to address the challenge. The main character assesses the situation carefully, considers available resources, and takes decisive action while ensuring team coordination. The resolution demonstrates both problem-solving skills and responsibility for outcomes, showing the kind of leadership qualities essential for military officers."
  };

  console.log('Returning fallback analysis due to image timeout');
  
  return new Response(JSON.stringify(fallbackAnalysis), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}
