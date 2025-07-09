interface TraitScore {
  trait: string;
  score: number;
  description: string;
}

interface AIFeedback {
  overallScore: number;
  traitScores: TraitScore[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  officerLikeQualities: string[];
  sampleResponse?: string;
}

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

export class AIService {
  private currentProvider: 'openai';

  constructor() {
    this.currentProvider = 'openai';
  }

  getCurrentProvider(): 'openai' {
    return this.currentProvider;
  }

  async analyzeResponse(
    testType: string,
    response: string,
    prompt?: string,
    imageUrl?: string,
    isPremium: boolean = false
  ): Promise<AIFeedback> {
    try {
      console.log(`Analyzing with OpenAI - Premium: ${isPremium}`);
      return await this.analyzeWithOpenAI(testType, response, prompt, imageUrl, isPremium);
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      return this.getFallbackFeedback();
    }
  }

  private async analyzeWithOpenAI(
    testType: string,
    response: string,
    prompt?: string,
    imageUrl?: string,
    isPremium: boolean = false
  ): Promise<AIFeedback> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('ai-analysis', {
      body: {
        testType,
        response,
        prompt,
        imageUrl,
        isPremium
      }
    });

    if (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }

    return data;
  }

  private getEnhancedSystemPrompt(testType: string, isPremium: boolean): string {
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

EVALUATION CRITERIA:
- Does the response show mature thinking and emotional stability?
- Are there clear signs of leadership potential and initiative?
- Does the candidate demonstrate practical problem-solving?
- Is there evidence of moral character and responsibility?
- How well does the response align with military officer expectations?

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

  private getEnhancedUserPrompt(testType: string, response: string, prompt?: string): string {
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

  private formatFeedback(analysis: any, isPremium: boolean): AIFeedback {
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

  private getFallbackFeedback(): AIFeedback {
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

  async analyzeTATBatch(
    batchData: Array<{
      imageNumber: number;
      imageUrl: string | null;
      prompt: string;
      response: string;
      isBlankSlide: boolean;
    }>,
    isPremium: boolean = false
  ): Promise<any> {
    try {
      console.log(`Analyzing TAT batch with OpenAI - Premium: ${isPremium}`);
      
      const systemPrompt = this.getTATBatchSystemPrompt(isPremium);
      const userPrompt = this.getTATBatchUserPrompt(batchData);

      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          testType: 'tat_batch',
          batchData,
          isPremium
        }
      });

      if (error) {
        throw new Error(`TAT batch analysis failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('TAT Batch Analysis Error:', error);
      return this.getFallbackFeedback();
    }
  }

  async analyzeWATBatch(
    batchData: Array<{ word: string; response: string }>,
    isPremium: boolean = false
  ): Promise<any> {
    try {
      const systemPrompt = this.getWATBatchSystemPrompt(isPremium);
      const userPrompt = this.getWATBatchUserPrompt(batchData);

      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          testType: 'wat_batch',
          batchData,
          isPremium
        }
      });

      if (error) {
        throw new Error(`WAT batch analysis failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('WAT Batch Analysis Error:', error);
      return this.getFallbackFeedback();
    }
  }

  async analyzeSRTBatch(
    batchData: Array<{ situation: string; response: string }>,
    isPremium: boolean = false
  ): Promise<any> {
    try {
      const systemPrompt = this.getSRTBatchSystemPrompt(isPremium);
      const userPrompt = this.getSRTBatchUserPrompt(batchData);

      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          testType: 'srt_batch',
          batchData,
          isPremium
        }
      });

      if (error) {
        throw new Error(`SRT batch analysis failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('SRT Batch Analysis Error:', error);
      return this.getFallbackFeedback();
    }
  }

  private getTATBatchSystemPrompt(isPremium: boolean): string {
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
  "storyPatterns": "Analysis of recurring themes and patterns across all stories",
  "bestStories": ["Story numbers that showed exceptional qualities"],
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

  private getTATBatchUserPrompt(batchData: any[]): string {
    let prompt = "TAT BATCH ANALYSIS:\n\n";
    
    batchData.forEach((item, index) => {
      prompt += `Story ${item.imageNumber}${item.isBlankSlide ? ' (Blank Slide)' : ''}:\n`;
      prompt += `Prompt: ${item.prompt}\n`;
      prompt += `Response: "${item.response}"\n\n`;
    });

    prompt += `Analyze these ${batchData.length} TAT stories comprehensively. Look for patterns, consistency, and overall psychological profile across all responses.`;
    
    return prompt;
  }

  private getWATBatchSystemPrompt(isPremium: boolean): string {
    // Similar structure for WAT batch analysis
    return `You are analyzing Word Association Test responses. Evaluate thought patterns, emotional stability, and officer-like thinking across all 60 word associations.

Look for: Positive vs negative associations, leadership mindset, emotional maturity, social responsibility.

${isPremium ? 'Provide detailed OLQ analysis.' : 'Provide basic assessment.'}`;
  }

  private getWATBatchUserPrompt(batchData: any[]): string {
    let prompt = "WAT BATCH ANALYSIS:\n\n";
    
    batchData.forEach((item, index) => {
      prompt += `${index + 1}. ${item.word} → "${item.response}"\n`;
    });

    return prompt + "\n\nAnalyze these word associations for psychological patterns and officer-like qualities.";
  }

  private getSRTBatchSystemPrompt(isPremium: boolean): string {
    return `Analyze Situation Reaction Test responses. Evaluate decision-making, leadership approach, and practical problem-solving across all situations.

Focus on: Initiative, responsibility, practical solutions, leadership potential.

${isPremium ? 'Provide detailed OLQ scoring.' : 'Provide basic assessment.'}`;
  }

  private getSRTBatchUserPrompt(batchData: any[]): string {
    let prompt = "SRT BATCH ANALYSIS:\n\n";
    
    batchData.forEach((item, index) => {
      prompt += `Situation ${index + 1}: ${item.situation}\n`;
      prompt += `Response: "${item.response}"\n\n`;
    });

    return prompt + "Analyze decision-making patterns and leadership qualities across all responses.";
  }
}

export const aiService = new AIService();
