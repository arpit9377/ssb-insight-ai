
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
  private openaiApiKey: string;
  private currentProvider: 'openai';

  constructor() {
    // Using the existing OpenAI API key from your code
    this.openaiApiKey = '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';
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
    const systemPrompt = this.getEnhancedSystemPrompt(testType, isPremium);
    const userPrompt = this.getEnhancedUserPrompt(testType, response, prompt);

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
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Starting with 3.5 as requested
        messages,
        temperature: 0.2, // Lower temperature for more consistent analysis
        max_tokens: 3500,
        response_format: { type: "json_object" }
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`OpenAI API request failed: ${apiResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await apiResponse.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return this.formatFeedback(analysis, isPremium);
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
}

export const aiService = new AIService();
