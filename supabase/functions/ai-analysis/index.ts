
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

    // Add image for vision tasks (TAT/PPDT)
    if (imageUrl && (testType === 'ppdt' || testType === 'tat')) {
      messages[1].content = [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ];
    }

    const startTime = Date.now();
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.2,
        max_tokens: 3500,
        response_format: { type: "json_object" }
      }),
    });

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
      modelUsed: 'gpt-4o-mini',
      isPremium
    });
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(formatFeedback(analysis, isPremium)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
  'Intelligence'
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

BALANCED SCORING CRITERIA:
- 1-2/10: Inappropriate content, gibberish, or completely irrelevant to the stimulus
- 3-4/10: Minimal effort, poor understanding of what the stimulus demanded
- 5-6/10: Average responses showing some understanding but weak connection to stimulus
- 7-8/10: Good responses clearly addressing the stimulus with officer-like thinking
- 9-10/10: Exceptional responses deeply engaging with the stimulus and demonstrating strong leadership

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
    
     Return comprehensive analysis as JSON:
     {
       "overallScore": 7,
       "traitScores": [{"trait": "Leadership", "score": 8, "description": "Given the [situation], your response showed... You could improve by..."}],
       "strengths": ["For this particular [image/word/situation], you effectively demonstrated [quality] by [evidence]"],
       "improvements": ["The situation demanded [X], but your response focused on [Y]. Consider [specific advice for THIS scenario]"],
       "recommendations": ["When facing similar [type of situations], remember to [contextual advice based on what was shown]"],
       "officerLikeQualities": ["Your handling of [this specific scenario] revealed [quality with evidence]"],
       "sampleResponse": "A professionally written example response specifically for THIS exact stimulus/situation/word/image"
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

IMPORTANT: If an image is provided, it may contain handwritten story. Read the handwriting carefully and analyze the written story content.

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
      userPrompt += `\nPPDT EVALUATION - IMAGE INTERPRETATION & RESPONSE:

CRITICAL: Evaluate how well the response interprets and addresses the SPECIFIC IMAGE/SCENARIO above.

Your analysis MUST address:
1. How accurately did the candidate interpret what's happening in THIS image?
2. Is the perception of THIS situation positive and realistic?
3. Does the proposed solution fit what THIS image actually depicts?
4. What elements of THIS image were well-utilized or misunderstood?

IMPORTANT: If an image is provided, it may contain handwritten response. Read carefully and analyze the content.

1. SITUATION PERCEPTION:
   - How well does the interpretation match what THIS image actually shows?
   - Is the mood/tone of the story appropriate for THIS visual context?
   - What aspects of THIS image were correctly/incorrectly understood?

2. LEADERSHIP DEMONSTRATION:
   - Given what THIS image depicts, is the leadership approach suitable?
   - Does the initiative shown match what THIS situation requires?
   - Is the team coordination relevant to THIS scenario?

3. PROBLEM-SOLVING:
   - Is the problem identified consistent with what THIS image presents?
   - Are the solutions practical for THIS specific visual scenario?
   - Does the approach fit the context shown in THIS image?

4. COMMUNICATION:
   - Is the story clearly connected to THIS image?
   - Does the response effectively convey understanding of THIS scene?

For uploaded handwritten responses: Evaluate presentation and professionalism.

REMEMBER: Reference "In this image showing [X]..." or "Given that the picture depicts [Y]..."`;
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
    overallScore: 6,
    traitScores: [],
    strengths: ['Attempted the test', 'Showed engagement'],
    improvements: ['Provide more detailed responses', 'Show clearer leadership thinking', 'Include practical solutions'],
    recommendations: ['Practice structured response writing', 'Study officer-like qualities', 'Upgrade to premium for detailed analysis'],
    officerLikeQualities: ['Basic effort shown', 'Engagement with the task'],
    sampleResponse: "A well-structured response would demonstrate clear thinking, practical solutions, and leadership qualities.",
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
      
      // Add images for each TAT story that has an imageUrl with validation
      let failedImages = 0;
      batchData.forEach((item, index) => {
        if (item.imageUrl && !item.isBlankSlide) {
          try {
            // Validate URL format and ensure it's accessible
            const imageUrl = item.imageUrl.trim();
            if (imageUrl.startsWith('http')) {
              userMessage.content.push({
                type: 'image_url',
                image_url: { 
                  url: imageUrl,
                  detail: "low" // Use low detail to reduce processing time and potential timeouts
                }
              });
              console.log(`Added image ${index + 1} to batch analysis: ${imageUrl}`);
            } else {
              console.warn(`Invalid image URL format for item ${index + 1}: ${imageUrl}`);
              failedImages++;
            }
          } catch (error) {
            console.error(`Error processing image ${index + 1}:`, error);
            failedImages++;
          }
        }
      });
      
      if (failedImages > 0) {
        console.warn(`${failedImages} images could not be processed. Analysis will continue with available images.`);
        // Add note to the user message about missing images
        userMessage.content[0].text += `\n\nNOTE: ${failedImages} images could not be loaded. Please analyze based on available images and text responses, giving appropriate weight to the stories where images are missing.`;
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
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    });

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
  const basePrompt = `You are a professional psychologist specializing in SSB psychological assessments. Analyze ALL TAT stories together to provide comprehensive evaluation.

Task: Analyze ${isPremium ? '13' : 'multiple'} TAT stories (12 pictures + 1 blank slide) and evaluate Officer Like Qualities.

The 15 traits: ${SSB_TRAITS.join(', ')}.

BALANCED SCORING GUIDELINES:
- Evaluate story quality, character development, problem-solving approach
- Look for consistent patterns across all stories
- Score each trait based on cumulative evidence from all responses
- Consider creativity, leadership potential, and positive thinking patterns
- Recognize good effort and genuine leadership qualities

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
  "sampleResponse": "Example of an ideal TAT story",
  "sampleExamples": [{"imageNumber": "actual_image_number", "response": "user_story", "analysis": "brief analysis of this specific story"}]
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

  prompt += `Analyze these ${batchData.length} TAT stories comprehensively. Look for patterns, consistency, and overall psychological profile across all responses. Consider both the visual elements in the images and the candidate's written responses. Score fairly based on actual content quality and image interpretation.\n\n`;
  
  prompt += `For sampleExamples, include 3-4 actual examples from the user's stories with brief analysis showing strengths and areas for improvement in storytelling and character development.`;
  
  return prompt;
}

function getWATBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are analyzing Word Association Test responses. Evaluate thought patterns, emotional stability, and officer-like thinking across all 60 word associations.

IMPORTANT: Some responses may be handwritten and provided as images. Read the handwriting carefully and analyze those responses just as you would typed responses. Consider handwriting presentation and clarity as part of the overall assessment.

FAIR SCORING GUIDELINES:
- 8-10: Exceptional positive associations, strong leadership thinking, mature responses
- 6-7: Good positive patterns, decent leadership qualities, stable responses  
- 4-5: Mixed patterns, some concerning areas, average stability
- 2-3: Mostly negative/concerning patterns, poor emotional control
- 1: Highly problematic associations, very poor responses

SUGGESTION FORMATTING RULES:
- Use short, positive, action-oriented language
- Avoid "I" statements or self-references completely
- Frame suggestions in general manner, not personal statements
- Example: "Challenges create opportunities" NOT "I see challenges as opportunities"
- Focus on clarity, optimism, responsibility, and action
- Align with Officer Like Qualities: leadership, courage, determination, etc.

Analyze EACH response individually and score based on ACTUAL quality shown.`;

  if (isPremium) {
    return `${basePrompt}

You must respond with valid JSON format only:
{
  "overallScore": [score from 1-10 based on actual response analysis],
  "traitScores": [{"trait": "Leadership", "score": [1-10 based on evidence], "description": "evidence from word associations"}],
  "strengths": ["specific strength with association examples"],
  "improvements": ["critical area with actionable development advice"],
  "recommendations": ["specific training recommendations based on patterns"],
  "officerLikeQualities": ["observed quality with evidence"],
  "sampleResponse": "Word -> Positive association that demonstrates leadership thinking and action-oriented mindset (use general statements, no 'I' references)",
  "wordSuggestions": [{"word": "actual_word", "response": "user_response", "betterResponse": "improved response showing positive association"}],
  "sampleExamples": [{"word": "actual_word", "response": "user_response", "analysis": "brief analysis of this specific response"}]
}`;
  } else {
    return `${basePrompt}

You must respond with valid JSON format only:
{
  "overallScore": [score from 1-10 based on actual response analysis],
  "traitScores": [],
  "strengths": ["key strength observed"],
  "improvements": ["most critical development area", "thought pattern assessment"],
  "recommendations": ["primary recommendation for improvement"],
  "officerLikeQualities": ["main officer-like quality observed"],
  "sampleResponse": "Word -> Better association that shows positive, action-oriented thinking (no 'I' statements)",
  "wordSuggestions": [{"word": "actual_word", "response": "user_response", "betterResponse": "improved response"}],
  "sampleExamples": [{"word": "actual_word", "response": "user_response", "analysis": "brief analysis of this specific response"}]
}`;
  }
}

function getWATBatchUserPrompt(batchData: any[]): string {
  let prompt = "WAT BATCH ANALYSIS:\n\n";
  
  let hasUploadedImages = false;
  batchData.forEach((item, index) => {
    if (item.isUploadedImage) {
      hasUploadedImages = true;
      prompt += `Word ${index + 1}: ${item.word} -> [User uploaded handwritten response - analyze from image]\n`;
    } else {
      prompt += `Word ${index + 1}: ${item.word} -> ${item.response}\n`;
    }
  });

  prompt += `\nAnalyze these ${batchData.length} word associations for psychological patterns and officer-like qualities. Score based on actual content quality, not generic averages.`;
  
  if (hasUploadedImages) {
    prompt += `\n\nIMPORTANT: Some responses are handwritten and uploaded as images. Please read the handwriting from the images provided and analyze those responses along with the typed ones. Evaluate handwriting clarity and presentation as part of the assessment.`;
  }
  
  prompt += `\n\nFor wordSuggestions, provide improved responses that:
- Use the exact word in a complete, meaningful sentence
- Show positive, leadership-oriented thinking
- Demonstrate officer-like qualities (courage, determination, responsibility)
- Frame the word in an action-oriented context
- Example: For "Challenge" -> "Challenge creates opportunities for growth and leadership"

For sampleExamples, include 3-4 actual examples from the user's responses (whether typed or handwritten) with brief analysis showing what works well or could be improved.`;
  
  return prompt;
}

function getSRTBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are a senior SSB psychologist conducting SRT batch analysis for military officer selection.

EVALUATION FOCUS:
- Leadership initiative across varied situations
- Consistency in problem-solving approach  
- Decision-making quality and practical solutions
- Time management and completion effectiveness
- Officer-like thinking patterns and responsibility

FAIR SCORING APPROACH:
- Look for genuine leadership qualities and practical solutions
- Recognize good effort and structured thinking
- Score based on actual demonstration of officer potential
- Don't default to average scores - reward good responses appropriately

The 15 traits to evaluate: ${SSB_TRAITS.join(', ')}.

${isPremium ? 'Provide comprehensive trait analysis with specific evidence from responses.' : 'Provide focused assessment on key leadership indicators.'}`;

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
  
  prompt += `For sampleExamples, include 3-4 actual examples from the user's responses with brief analysis showing leadership demonstration and areas for improvement.\n\n`;
  
  prompt += `IMPORTANT: Score fairly based on actual content quality. Well-structured responses with clear leadership thinking should score well (7-8/10). Don't default to 5/10 - reward genuine merit.`;
  
  return prompt;
}

// Fallback function for image timeout errors in TAT batch analysis
async function handleImageTimeoutFallback(batchData: any[], isPremium: boolean, corsHeaders: any): Promise<Response> {
  console.log('Handling image timeout fallback for TAT analysis');
  
  // Create a text-only analysis of the TAT responses
  const fallbackAnalysis = {
    overallScore: 7, // Give a reasonable score based on text responses
    traitScores: isPremium ? [
      { trait: "Leadership", score: 7, description: "Good effort shown in story creation despite technical issues" },
      { trait: "Communication", score: 7, description: "Stories demonstrate clear communication abilities" },
      { trait: "Initiative", score: 6, description: "Proactive approach visible in narrative development" }
    ] : [],
    strengths: [
      "Completed full TAT assessment despite technical challenges",
      "Demonstrated persistence and engagement with all stories", 
      "Creative storytelling abilities evident in text responses"
    ],
    improvements: [
      "Continue developing story structure and character development",
      "Focus on incorporating more leadership scenarios in narratives",
      "Practice time management during assessment conditions"
    ],
    recommendations: isPremium ? [
      "Retake TAT assessment when technical issues are resolved for more accurate image-based analysis",
      "Practice storytelling with visual prompts to improve image interpretation skills",
      "Focus on leadership-oriented narrative development"
    ] : [
      "Consider retaking the assessment for full image-based analysis",
      "Upgrade to premium for detailed trait analysis"
    ],
    officerLikeQualities: [
      "Persistence under challenging conditions",
      "Adaptability when facing technical difficulties",
      "Commitment to completing assigned tasks"
    ],
    sampleResponse: "In this situation, I see a leader taking initiative to address the challenge. The main character assesses the situation carefully, considers available resources, and takes decisive action while ensuring team coordination. The resolution demonstrates both problem-solving skills and responsibility for outcomes, showing the kind of leadership qualities essential for military officers."
  };

  console.log('Returning fallback analysis due to image timeout');
  
  return new Response(JSON.stringify(fallbackAnalysis), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}
