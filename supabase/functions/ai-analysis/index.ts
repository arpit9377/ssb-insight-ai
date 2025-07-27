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

    const openaiApiKey = Deno.env.get('openaiApiKey');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { testType, response, prompt, imageUrl, isPremium = false, batchData, sessionId } = await req.json();

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
    const userPrompt = getUserPrompt(testType, response, prompt);

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
        model: 'gpt-4o-mini',
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
  const basePrompt = `You are a professional psychologist specializing in SSB (Services Selection Board) psychological assessments, conducting a comprehensive evaluation of a candidate's Officer Like Qualities (OLQs) through their written response and accompanying image.

Task: Perform a detailed psychological analysis of the candidate's response, systematically evaluating their performance against the 15 critical Officer Like Qualities (OLQs) used in SSB testing.

Objective: Provide a comprehensive, objective, and constructive psychological assessment that reveals the candidate's potential for leadership, character strength, and suitability for military officer selection.

Knowledge: The 15 Officer Like Qualities (OLQs) to be evaluated include: ${SSB_TRAITS.join(', ')}.

Instructions:
- Analyze the response and image with extreme precision
- Rate each OLQ on a scale of 1-10
- Provide specific behavioral evidence supporting each rating
- Highlight strengths and areas for potential improvement
- Maintain a professional, objective, and constructive tone
- Ensure your feedback is actionable and developmental

Critical Guidance: Your assessment must be:
- Deeply analytical
- Backed by concrete psychological principles
- Free from personal bias
- Focused on potential for growth and development

STRICT SCORING GUIDELINES:
- Random text, gibberish, or irrelevant content: 1-2/10
- Poor grammar, spelling, or incoherent responses: 2-3/10
- Basic responses with minimal depth: 3-4/10
- Average responses showing some understanding: 5-6/10
- Good responses with clear officer-like qualities: 7-8/10
- Exceptional responses demonstrating strong leadership: 9-10/10

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

function getUserPrompt(testType: string, response: string, prompt?: string): string {
  let userPrompt = `Test Type: ${testType.toUpperCase()}\n`;
  if (prompt) {
    userPrompt += `Situation/Prompt: ${prompt}\n`;
  }
  userPrompt += `Candidate Response: "${response}"\n\n`;
  
  switch (testType) {
    case 'tat':
      userPrompt += `Evaluate this TAT story for:
- Story structure (beginning, middle, end with clear timeline)
- Character development and motivation
- Problem identification and resolution approach
- Leadership qualities demonstrated by characters
- Emotional maturity and stability shown
- Initiative and decision-making abilities
- Moral values and ethical considerations
- Communication effectiveness
Be extremely strict - random text should score very low (1-2/10). Good stories with officer-like qualities should score 7-8/10.`;
      break;
    case 'wat':
      userPrompt += `Evaluate this word association for:
- Positive vs negative thinking patterns
- Officer-like mental associations
- Emotional stability indicators
- Leadership mindset demonstration
- Practical and constructive thinking
- Social responsibility awareness
Be strict - inappropriate or negative responses should score low. Positive, constructive associations score higher.`;
      break;
    case 'srt':
      userPrompt += `Evaluate this situation response for:
- Immediate problem identification
- Practical solution approach
- Leadership initiative taken
- Decision-making clarity
- Responsibility acceptance
- Teamwork and cooperation
- Risk assessment and management
Be harsh on vague responses. Look for specific, actionable solutions with clear leadership approach.`;
      break;
    case 'ppdt':
      userPrompt += `Evaluate this PPDT discussion for:
- Logical analysis of the picture
- Positive interpretation of the situation
- Practical solutions proposed
- Leadership approach demonstrated
- Team coordination abilities
- Communication effectiveness
- Problem-solving methodology
Be critical of superficial responses. Look for depth, positivity, and practical leadership solutions.`;
      break;
    default:
      userPrompt += `Evaluate this response according to strict SSB psychological assessment standards for officer selection.`;
  }
  
  return userPrompt;
}

function formatFeedback(analysis: any, isPremium: boolean): any {
  return {
    overallScore: analysis.overallScore || 5,
    traitScores: isPremium ? (analysis.traitScores || []) : [],
    strengths: analysis.strengths || ['Attempted the test'],
    improvements: analysis.improvements || ['Provide more detailed responses', 'Focus on officer-like qualities'],
    recommendations: analysis.recommendations || ['Practice structured responses', 'Upgrade to premium for detailed analysis'],
    officerLikeQualities: analysis.officerLikeQualities || ['Shows basic effort'],
    sampleResponse: analysis.sampleResponse || "A well-structured response would demonstrate clear thinking, practical solutions, and leadership qualities.",
  };
}

function getFallbackFeedback(): any {
  return {
    overallScore: 5,
    traitScores: [],
    strengths: ['Attempted the test'],
    improvements: ['Provide more detailed responses', 'Focus on officer-like qualities', 'Show better problem-solving'],
    recommendations: ['Practice writing more structured responses', 'Study officer-like qualities', 'Upgrade to premium for detailed analysis'],
    officerLikeQualities: ['Shows basic effort'],
    sampleResponse: "A well-structured response would demonstrate clear thinking, practical solutions, and leadership qualities.",
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
  return `You are analyzing Situation Reaction Test responses. Evaluate leadership approach, problem-solving, and decision-making across all situations.

Look for: Leadership initiative, practical solutions, responsibility acceptance, team coordination.

${isPremium ? 'Provide detailed OLQ analysis.' : 'Provide basic assessment.'}`;
}

function getSRTBatchUserPrompt(batchData: any[]): string {
  let prompt = "SRT BATCH ANALYSIS:\n\n";
  
  batchData.forEach((item, index) => {
    prompt += `Situation ${index + 1}: ${item.situation}\n`;
    prompt += `Response: "${item.response}"\n\n`;
  });

  prompt += `Analyze these ${batchData.length} situation responses for leadership qualities and problem-solving approach.`;
  
  return prompt;
}