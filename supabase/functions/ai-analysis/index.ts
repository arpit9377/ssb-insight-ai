
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

The 15 traits you MUST evaluate: ${SSB_TRAITS.join(', ')}.

ASSESSMENT PHILOSOPHY:
- Recognize genuine effort and positive qualities in responses
- Look for potential and areas of strength alongside areas for improvement  
- Provide constructive feedback that encourages development
- Score fairly based on actual content and demonstration of officer-like thinking

BALANCED SCORING CRITERIA:
- 1-2/10: Inappropriate content, gibberish, or completely irrelevant responses
- 3-4/10: Minimal effort, poor understanding, lacks basic structure
- 5-6/10: Average responses showing some understanding and effort
- 7-8/10: Good responses with clear officer-like thinking and problem-solving
- 9-10/10: Exceptional responses demonstrating strong leadership potential

PSYCHOLOGICAL INDICATORS TO ASSESS:
- Leadership initiative and decision-making capability
- Practical problem-solving approach
- Communication clarity and organization
- Responsibility acceptance and accountability
- Team coordination and social skills
- Adaptability and planning abilities
- Emotional stability and confidence
- Moral courage and determination

You must respond with valid JSON format only.`;
  
  if (isPremium) {
    return `${basePrompt}
    
    Analyze the ${testType.toUpperCase()} response against all 15 traits.
    
    For each trait, provide:
    - Score (1-10) with detailed psychological justification
    - Specific behavioral evidence from the response
    - Areas for improvement with actionable suggestions
    
    Also provide:
    - A sample ideal response demonstrating excellence
    - Specific developmental recommendations
    - Clear identification of officer-like qualities observed
    
     Return comprehensive analysis as JSON:
     {
       "overallScore": 7,
       "traitScores": [{"trait": "Leadership", "score": 8, "description": "detailed psychological analysis with evidence"}],
       "strengths": ["specific strength with evidence", "specific strength with evidence"],
       "improvements": ["specific area with actionable advice", "specific area with actionable advice"],
       "recommendations": ["developmental recommendation with steps", "developmental recommendation with steps"],
       "officerLikeQualities": ["observed quality with evidence", "observed quality with evidence"],
       "sampleResponse": "A professionally written example response demonstrating excellence for this prompt"
     }`;
  } else {
    return `${basePrompt}
    
    Provide a professional basic assessment focusing on overall performance and key areas.
    Include a sample response to demonstrate improvement potential.
    
    Return analysis as JSON:
    {
      "overallScore": 6,
      "traitScores": [],
      "strengths": ["key strength 1", "key strength 2"],
      "improvements": ["critical area 1", "critical area 2", "critical area 3"],
      "recommendations": ["Upgrade to premium for detailed 15-trait analysis and personalized development plan"],
      "officerLikeQualities": ["basic quality 1", "basic quality 2"],
      "sampleResponse": "A sample ideal response demonstrating how this could be written better"
    }`;
  }
}

function getUserPrompt(testType: string, response: string, prompt?: string, timeTaken?: number, totalQuestions?: number, completedQuestions?: number): string {
  let userPrompt = `TEST TYPE: ${testType.toUpperCase()}\n`;
  if (prompt) {
    userPrompt += `SITUATION/PROMPT: ${prompt}\n`;
  }
  userPrompt += `CANDIDATE RESPONSE: "${response}"\n`;
  
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
      userPrompt += `TAT EVALUATION CRITERIA:

STORY STRUCTURE (25%):
- Complete narrative with beginning, middle, end
- Logical sequence and character development
- Clear conflict and resolution

LEADERSHIP QUALITIES (35%):
- Initiative and decision-making
- Problem-solving approach
- Team coordination and responsibility
- Positive thinking patterns

PSYCHOLOGICAL MATURITY (25%):
- Emotional stability and realistic thinking
- Understanding of consequences
- Balanced optimism

COMMUNICATION (15%):
- Clear articulation and organization
- Demonstration of values
- Constructive approach

IMPORTANT: Score based on actual content quality. A well-structured story with good leadership demonstration should score 7-8/10. Only gibberish or inappropriate content should score very low.`;
      break;
    case 'wat':
      userPrompt += `WAT EVALUATION CRITERIA:

MENTAL ASSOCIATIONS (40%):
- Positive vs negative thought patterns
- Speed and appropriateness of associations
- Officer-like mindset demonstration

EMOTIONAL STABILITY (30%):
- Consistent positive responses
- Absence of extreme negativity
- Balanced emotional patterns

LEADERSHIP MINDSET (20%):
- Action-oriented associations
- Service and team focus
- Problem-solving orientation

VALUES (10%):
- Moral and ethical associations
- Social responsibility
- Integrity indicators

IMPORTANT: Score fairly - positive, appropriate associations should score well (6-8/10). Only inappropriate or consistently negative responses score low.`;
      break;
    case 'srt':
      userPrompt += `SRT RESPONSE EVALUATION:

1. PROBLEM UNDERSTANDING:
   - Clear grasp of the situation
   - Accurate problem identification
   - Situational awareness demonstration

2. LEADERSHIP INITIATIVE:
   - Taking charge and responsibility
   - Proactive vs reactive approach
   - Decision-making capability

3. PRACTICAL SOLUTIONS:
   - Realistic and implementable approaches
   - Step-by-step planning
   - Resource consideration

4. EXECUTION FOCUS:
   - Personal ownership and accountability
   - Follow-through commitment
   - Result-oriented thinking

BALANCED SCORING:
- Well-thought responses with clear leadership approach: 7-8/10
- Decent responses showing some initiative: 6-7/10
- Basic responses with minimal leadership: 4-5/10
- Poor or irrelevant responses: 2-3/10

${timeTaken ? `Response Time: ${timeTaken}s - Consider quality vs speed balance` : ''}
${completedQuestions && totalQuestions ? `Completion: ${completedQuestions}/${totalQuestions} - Factor in persistence` : ''}

IMPORTANT: Focus on the actual leadership qualities demonstrated in the response. Don't default to 5/10 - score based on genuine merit.`;
      break;
    case 'ppdt':
      userPrompt += `PPDT RESPONSE EVALUATION:

1. SITUATION PERCEPTION:
   - Accurate interpretation of scenario
   - Positive and constructive viewpoint
   - Realistic assessment

2. LEADERSHIP DEMONSTRATION:
   - Natural initiative taking
   - Team coordination abilities
   - Motivational approach

3. PROBLEM-SOLVING:
   - Systematic and organized thinking
   - Practical solution approach
   - Strategic consideration

4. COMMUNICATION:
   - Clear articulation
   - Persuasive presentation
   - Organized thought process

FAIR SCORING: Good responses with clear leadership demonstration should score 7-8/10. Only poor or negative interpretations should score low.`;
      break;
    default:
      userPrompt += `Evaluate this response for officer-like qualities, leadership potential, and psychological maturity. Score fairly based on actual content quality.`;
  }
  
  userPrompt += `

CRITICAL INSTRUCTIONS:
1. Analyze the actual content and quality of the response
2. Look for genuine officer-like qualities and leadership potential
3. Score based on merit - don't default to average scores
4. Provide specific evidence from their response
5. Be encouraging yet constructive in feedback
6. Remember: A thoughtful, well-structured response deserves a good score (7-8/10)`;
  
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
      // For TAT batch, include images in the message content
      const userMessage: any = { role: 'user', content: [] };
      
      // Add text prompt first
      userMessage.content.push({
        type: 'text',
        text: userPrompt
      });
      
      // Add images for each TAT story that has an imageUrl
      batchData.forEach((item) => {
        if (item.imageUrl && !item.isBlankSlide) {
          userMessage.content.push({
            type: 'image_url',
            image_url: { url: item.imageUrl }
          });
        }
      });
      
      messages.push(userMessage);
    } else {
      // For WAT and SRT, use text-only messages
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
  "sampleResponse": "Example of an ideal TAT story"
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
  "sampleResponse": "Example story improvement"
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

  prompt += `Analyze these ${batchData.length} TAT stories comprehensively. Look for patterns, consistency, and overall psychological profile across all responses. Consider both the visual elements in the images and the candidate's written responses. Score fairly based on actual content quality and image interpretation.`;
  
  return prompt;
}

function getWATBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are analyzing Word Association Test responses. Evaluate thought patterns, emotional stability, and officer-like thinking across all 60 word associations.

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
  "wordSuggestions": [{"word": "actual_word", "response": "user_response", "betterResponse": "improved response showing positive association"}]
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
  "wordSuggestions": [{"word": "actual_word", "response": "user_response", "betterResponse": "improved response"}]
}`;
  }
}

function getWATBatchUserPrompt(batchData: any[]): string {
  let prompt = "WAT BATCH ANALYSIS:\n\n";
  
  batchData.forEach((item, index) => {
    prompt += `Word ${index + 1}: ${item.word} -> ${item.response}\n`;
  });

  prompt += `\nAnalyze these ${batchData.length} word associations for psychological patterns and officer-like qualities. Score based on actual content quality, not generic averages.

For wordSuggestions, provide improved responses that:
- Use the exact word in a complete, meaningful sentence
- Show positive, leadership-oriented thinking
- Demonstrate officer-like qualities (courage, determination, responsibility)
- Frame the word in an action-oriented context
- Example: For "Challenge" -> "Challenge creates opportunities for growth and leadership"`;
  
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
  "sampleResponse": "Example of ideal SRT response demonstrating excellence"
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
  "sampleResponse": "Example of improved SRT response"
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
  
  prompt += `IMPORTANT: Score fairly based on actual content quality. Well-structured responses with clear leadership thinking should score well (7-8/10). Don't default to 5/10 - reward genuine merit.`;
  
  return prompt;
}
