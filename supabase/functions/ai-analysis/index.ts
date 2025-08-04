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
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    const { testType, response, prompt, imageUrl, isPremium = false, batchData, sessionId, timeTaken, totalQuestions, completedQuestions } = await req.json();

    // If sessionId is provided, verify user owns this session
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session || session.user_id !== user.id) {
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

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.2,
        max_tokens: 3500,
        response_format: { type: "json_object" }
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`OpenAI API request failed: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
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
  'Effective Intelligence',
  'Reasoning Ability', 
  'Emotional Stability',
  'Social Adaptability',
  'Moral and Character Stamina',
  'Leadership',
  'Initiative',
  'Decisiveness',
  'Courage',
  'Determination',
  'Sense of Responsibility',
  'Self-Confidence',
  'Cooperation',
  'Organizing Ability',
  'Communication Skills'
];

function getSystemPrompt(testType: string, isPremium: boolean): string {
  const basePrompt = `You are a highly experienced SSB (Services Selection Board) psychologist with 15+ years of experience in military officer selection. You conduct extremely rigorous psychological assessments that determine a candidate's suitability for military leadership positions.

ROLE: Senior Military Psychologist & Selection Expert
TASK: Conduct a comprehensive, uncompromising evaluation of Officer Like Qualities (OLQs)
STANDARD: Military-grade assessment with zero tolerance for mediocrity

The 15 Officer Like Qualities you MUST evaluate: ${SSB_TRAITS.join(', ')}.

ASSESSMENT PHILOSOPHY:
- Military officers must demonstrate exceptional standards
- Mediocre responses indicate lack of officer potential
- Only candidates showing clear leadership traits should score well
- Every response must be scrutinized for psychological indicators

STRICT SCORING CRITERIA (NO LENIENCY):
- 1-2/10: Gibberish, inappropriate content, completely irrelevant responses
- 2-3/10: Poor language, minimal effort, shows no understanding of military values
- 3-4/10: Basic effort but lacks depth, no clear officer qualities visible
- 4-5/10: Average civilian response, some coherence but no leadership indicators
- 5-6/10: Decent response with hints of potential, needs significant development
- 6-7/10: Good response showing some officer-like thinking and problem-solving
- 7-8/10: Strong response with clear leadership qualities and mature thinking
- 8-9/10: Excellent response demonstrating multiple OLQs and military mindset
- 9-10/10: Outstanding response showing exceptional officer potential and leadership

PSYCHOLOGICAL INDICATORS TO ASSESS:
- Leadership initiative and decision-making capability
- Emotional stability under pressure situations
- Moral courage and ethical reasoning
- Practical problem-solving with resource constraints
- Team coordination and conflict resolution
- Communication clarity and persuasion skills
- Responsibility acceptance and accountability
- Adaptability to changing circumstances
- Physical and mental courage demonstration
- Social intelligence and interpersonal skills

You must respond with valid JSON format only.`;
  
  if (isPremium) {
    return `${basePrompt}
    
    Analyze the ${testType.toUpperCase()} response against all 15 SSB traits.
    
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
      "overallScore": number (1-10, average of trait scores),
      "traitScores": [{"trait": "trait_name", "score": number (1-10), "description": "detailed psychological analysis with evidence"}],
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
      "overallScore": number (1-10, based on overall assessment),
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
      userPrompt += `MILITARY-GRADE TAT EVALUATION CRITERIA:

STORY STRUCTURE ASSESSMENT (25%):
- Complete narrative arc with clear beginning, middle, end
- Logical sequence of events with proper timeline
- Character motivations that align with military values
- Conflict resolution demonstrating leadership approach

LEADERSHIP INDICATORS (35%):
- Characters taking initiative in difficult situations
- Decision-making under pressure and uncertainty
- Responsibility acceptance without deflection
- Team coordination and resource management
- Moral courage in face of ethical dilemmas

PSYCHOLOGICAL MATURITY (25%):
- Emotional stability during crisis situations
- Realistic assessment of problems and solutions
- Balanced optimism without naive thinking
- Understanding of consequences and planning

COMMUNICATION & VALUES (15%):
- Clear articulation of thoughts and plans
- Demonstration of military/service values
- Positive thinking patterns and solution orientation
- Social responsibility and care for others

SCORING STRICTNESS: 
- Incomplete stories or poor grammar: Maximum 3/10
- Basic civilian responses without leadership: Maximum 4/10
- Stories lacking initiative or problem-solving: Maximum 5/10
- Only responses showing clear officer potential score 7+/10`;
      break;
    case 'wat':
      userPrompt += `MILITARY-GRADE WAT EVALUATION CRITERIA:

MENTAL ASSOCIATION PATTERNS (40%):
- Immediate positive vs negative thought patterns
- Speed of association and mental agility
- Officer-like thinking vs civilian mindset
- Constructive vs destructive tendencies

EMOTIONAL STABILITY INDICATORS (30%):
- Consistent positive associations across words
- Absence of anxiety, fear, or negative projections
- Balanced emotional responses to challenging words
- Mental resilience and optimism

LEADERSHIP MINDSET (20%):
- Associations showing initiative and action orientation
- Service before self mentality
- Team-focused vs self-centered thinking
- Problem-solving orientation

VALUES & CHARACTER (10%):
- Moral and ethical associations
- Social responsibility indicators
- Integrity and honesty in responses
- Military values alignment

CRITICAL SCORING:
- Negative, inappropriate, or depressive associations: Maximum 3/10
- Purely personal/selfish associations: Maximum 4/10
- Generic civilian responses: Maximum 5/10
- Only military-minded, positive, action-oriented responses score 7+/10`;
      break;
    case 'srt':
      userPrompt += `
SRT RESPONSE ANALYSIS - Military Standards:

1. PROBLEM UNDERSTANDING EVALUATION:
   - Does the response show clear understanding of the situation?
   - Is the problem identification accurate and complete?
   - Quote specific parts showing situational awareness

2. LEADERSHIP INITIATIVE ASSESSMENT:
   - Does the candidate take charge immediately or wait for others?
   - Is the approach proactive and decisive or reactive and hesitant?
   - Identify specific action words that show leadership vs following

3. SOLUTION PRACTICALITY CHECK:
   - Are the proposed solutions realistic and implementable?
   - Does the response show step-by-step planning?
   - Point to specific elements showing practical thinking vs theoretical approach

4. RESPONSIBILITY & EXECUTION EVALUATION:
   - Does the candidate take personal ownership of the problem?
   - Is there evidence of follow-through and accountability?
   - Quote phrases showing commitment to implementation

5. TIME MANAGEMENT ANALYSIS:
${timeTaken ? `   - Response time: ${timeTaken}s - Evaluate if quick response compromised quality` : ''}
${completedQuestions && totalQuestions ? `   - Completion rate: ${completedQuestions}/${totalQuestions} - Assess persistence and time management` : ''}

SCORING CRITERIA:
- Vague, impractical, or victim-mentality responses: MAX 3/10
- Basic problem-solving without leadership initiative: MAX 5/10
- Good solutions with some leadership qualities: 6-7/10
- Exceptional leadership demonstration with practical execution: 8-10/10`;
      break;
    case 'ppdt':
      userPrompt += `
PPDT RESPONSE ANALYSIS - Military Standards:

1. SITUATION PERCEPTION EVALUATION:
   - Does the response show accurate interpretation of the image/scenario?
   - Is the perception positive and constructive or negative?
   - Quote specific descriptions that show perception quality

2. LEADERSHIP DEMONSTRATION CHECK:
   - Does the candidate naturally take initiative in the described scenario?
   - Is there evidence of team coordination and motivation?
   - Identify specific actions/words showing leadership vs following

3. PROBLEM-SOLVING ASSESSMENT:
   - Is the approach systematic and well-planned?
   - Are solutions practical and achievable?
   - Point to specific problem-solving elements in the response

4. COMMUNICATION EFFECTIVENESS:
   - Is the response clearly articulated and organized?
   - Does it show ability to influence and persuade?
   - Quote examples of effective vs ineffective communication

5. MILITARY MINDSET EVALUATION:
   - Does the response reflect service orientation?
   - Is there evidence of strategic thinking?
   - Identify phrases showing military vs civilian approach

SCORING CRITERIA:
- Negative interpretation or passive role description: MAX 3/10
- Basic problem description without leadership: MAX 5/10
- Good leadership demonstration with practical solutions: 6-8/10
- Outstanding military leadership with strategic thinking: 9-10/10`;
      break;
    default:
      userPrompt += `
GENERAL RESPONSE ANALYSIS - Military Standards:

Evaluate this response for officer-like qualities, leadership potential, and psychological maturity.
Provide specific evidence from their actual response to support your assessment.
Be strict but constructive in your evaluation.`;
  }
  
  userPrompt += `

MANDATORY ANALYSIS REQUIREMENTS:
1. Quote specific phrases from the candidate's response in your feedback
2. Explain exactly why each score was given with evidence
3. Compare their response to what an ideal officer candidate would have written
4. Provide a sample ideal response that demonstrates better military thinking
5. Be constructively critical - help them understand their gaps

Remember: Most responses should score 3-6/10. Only truly exceptional military leadership demonstration deserves 7+/10.`;
  
  return userPrompt;
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
  };
}

function getFallbackFeedback(): any {
  return {
    overallScore: 2,
    traitScores: [],
    strengths: ['Attempted the test'],
    improvements: ['Provide more detailed responses', 'Develop clearer thinking', 'Show better problem-solving skills'],
    recommendations: ['Study officer-like qualities thoroughly', 'Practice structured response writing', 'Upgrade to premium for detailed analysis'],
    officerLikeQualities: ['Basic effort shown'],
    sampleResponse: "Unable to generate personalized feedback. Please try again or upgrade to premium for better analysis.",
  };
}

async function handleBatchAnalysis(testType: string, batchData: any[], isPremium: boolean, openaiApiKey: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
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
      throw new Error('Invalid batch test type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: isPremium ? 4000 : 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(formatFeedback(analysis, isPremium)), {
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

The 15 Officer Like Qualities: ${SSB_TRAITS.join(', ')}.

STRICT SCORING GUIDELINES:
- Evaluate story quality, character development, problem-solving approach
- Look for consistent patterns across all stories
- Score each OLQ based on cumulative evidence from all responses
- Consider creativity, leadership potential, and positive thinking patterns

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
    prompt += `Prompt: ${item.prompt}\n`;
    prompt += `Response: "${item.response}"\n\n`;
  });

  prompt += `Analyze these ${batchData.length} TAT stories comprehensively. Look for patterns, consistency, and overall psychological profile across all responses.`;
  
  return prompt;
}

function getWATBatchSystemPrompt(isPremium: boolean): string {
  return `You are analyzing Word Association Test responses. Evaluate thought patterns, emotional stability, and officer-like thinking across all 60 word associations.

Look for: Positive vs negative associations, leadership mindset, emotional maturity, social responsibility.

${isPremium ? 'Provide detailed OLQ analysis.' : 'Provide basic assessment.'}`;
}

function getWATBatchUserPrompt(batchData: any[]): string {
  let prompt = "WAT BATCH ANALYSIS:\n\n";
  
  batchData.forEach((item, index) => {
    prompt += `Word ${index + 1}: ${item.word} -> ${item.response}\n`;
  });

  prompt += `\nAnalyze these ${batchData.length} word associations for psychological patterns and officer-like qualities.`;
  
  return prompt;
}

function getSRTBatchSystemPrompt(isPremium: boolean): string {
  const basePrompt = `You are a senior SSB psychologist conducting a comprehensive SRT batch analysis. This is a critical assessment for military officer selection.

EVALUATION FOCUS:
- Leadership initiative across varied situations
- Consistency in problem-solving approach  
- Decision-making quality under different pressures
- Time management and completion effectiveness
- Practical vs theoretical solution orientation
- Team coordination and resource management
- Emotional stability across diverse challenges

CRITICAL ASSESSMENT AREAS:
- Response quality vs response speed balance
- Completion rate impact on overall leadership assessment
- Consistency of officer-like thinking patterns
- Adaptability to different situation types
- Initiative level and proactive vs reactive tendencies

The 15 Officer Like Qualities to evaluate: ${SSB_TRAITS.join(', ')}.

${isPremium ? 'Provide comprehensive OLQ analysis with specific evidence from multiple responses.' : 'Provide focused assessment on key leadership indicators.'}`;

  if (isPremium) {
    return `${basePrompt}

Return detailed batch analysis:
{
  "overallScore": number (1-10, heavily weighted by completion rate and response quality),
  "traitScores": [{"trait": "trait_name", "score": number, "description": "evidence from multiple responses"}],
  "strengths": ["specific strength with response examples"],
  "improvements": ["critical area with actionable development advice"],
  "recommendations": ["specific training recommendations based on patterns"],
  "officerLikeQualities": ["observed leadership qualities with evidence"],
  "sampleResponse": "Example of ideal SRT response demonstrating excellence"
}`;
  } else {
    return `${basePrompt}

Return focused assessment:
{
  "overallScore": number (1-10, considering completion and quality),
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
  let prompt = "COMPREHENSIVE SRT BATCH ANALYSIS:\n\n";
  
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
  const totalExpected = 60; // Standard SRT test has 60 situations
  
  prompt += `COMPLETION ANALYSIS:\n`;
  prompt += `- Completed: ${completionRate}/${totalExpected} situations (${Math.round((completionRate/totalExpected) * 100)}%)\n`;
  prompt += `- Average response quality needs assessment\n`;
  prompt += `- Time management evaluation required\n\n`;
  
  prompt += `COMPREHENSIVE EVALUATION REQUIRED:\n`;
  prompt += `1. Analyze CONSISTENCY of leadership approach across all responses\n`;
  prompt += `2. Evaluate COMPLETION RATE impact on officer selection suitability\n`;
  prompt += `3. Assess QUALITY vs SPEED balance in decision-making\n`;
  prompt += `4. Identify PATTERNS in problem-solving methodology\n`;
  prompt += `5. Determine overall OFFICER POTENTIAL based on cumulative evidence\n\n`;
  
  prompt += `Apply strict military selection standards. Incomplete tests or poor response patterns significantly impact scoring.`;
  
  return prompt;
}