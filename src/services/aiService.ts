
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
  'Leadership',
  'Initiative', 
  'Determination',
  'Courage',
  'Social Adaptability',
  'Reasoning Ability',
  'Emotional Stability',
  'Planning & Organization',
  'Effective Intelligence',
  'Self-Confidence',
  'Cooperation',
  'Sense of Responsibility',
  'Stamina',
  'Liveliness',
  'Speed of Decision'
];

export class AIService {
  private geminiApiKey: string;
  private openaiApiKey: string;
  private currentProvider: 'gemini' | 'openai';

  constructor() {
    this.geminiApiKey = 'AIzaSyCKA1JuneqLKlIALNwnWmo0XEPVA_ofAQs';
    this.openaiApiKey = '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';
    this.currentProvider = 'gemini';
  }

  getCurrentProvider(): 'gemini' | 'openai' {
    return this.currentProvider;
  }

  switchProvider(provider: 'gemini' | 'openai') {
    this.currentProvider = provider;
    console.log(`AI Provider switched to: ${provider}`);
  }

  async analyzeResponse(
    testType: string,
    response: string,
    prompt?: string,
    imageUrl?: string,
    isPremium: boolean = false
  ): Promise<AIFeedback> {
    try {
      console.log(`Analyzing with ${this.currentProvider} - Premium: ${isPremium}`);
      
      if (this.currentProvider === 'gemini') {
        return await this.analyzeWithGemini(testType, response, prompt, imageUrl, isPremium);
      } else {
        return await this.analyzeWithOpenAI(testType, response, prompt, imageUrl, isPremium);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getFallbackFeedback();
    }
  }

  private async analyzeWithGemini(
    testType: string,
    response: string,
    prompt?: string,
    imageUrl?: string,
    isPremium: boolean = false
  ): Promise<AIFeedback> {
    const systemPrompt = this.getSystemPrompt(testType, isPremium);
    const userPrompt = this.getUserPrompt(testType, response, prompt);

    const requestBody: any = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 3000,
      }
    };

    if (imageUrl && (testType === 'ppdt' || testType === 'tat')) {
      requestBody.contents[0].parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: await this.getBase64FromUrl(imageUrl)
        }
      });
    }

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`Gemini API request failed: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    const analysis = JSON.parse(data.candidates[0].content.parts[0].text);

    return this.formatFeedback(analysis, isPremium);
  }

  private async analyzeWithOpenAI(
    testType: string,
    response: string,
    prompt?: string,
    imageUrl?: string,
    isPremium: boolean = false
  ): Promise<AIFeedback> {
    const systemPrompt = this.getSystemPrompt(testType, isPremium);
    const userPrompt = this.getUserPrompt(testType, response, prompt);

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

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
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(`OpenAI API request failed: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return this.formatFeedback(analysis, isPremium);
  }

  private async getBase64FromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  private getSystemPrompt(testType: string, isPremium: boolean): string {
    const basePrompt = `You are a strict SSB psychological assessor with 20+ years of experience. You MUST be extremely critical and precise in your evaluation.

CRITICAL EVALUATION CRITERIA:
- Random text, gibberish, or irrelevant content should score 1-2/10
- Poor grammar, spelling, or incoherent responses should score 2-3/10
- Basic responses with minimal depth should score 3-4/10
- Average responses showing some understanding should score 5-6/10
- Good responses with clear officer-like qualities should score 7-8/10
- Exceptional responses demonstrating strong leadership should score 9-10/10

STRICT SCORING GUIDELINES:
- Be harsh on responses that lack substance, depth, or relevance
- Look for genuine officer-like qualities, not just keywords
- Evaluate problem-solving approach, leadership potential, and decision-making
- Consider emotional maturity, responsibility, and practical thinking
- Random or nonsensical text should receive very low scores`;
    
    if (isPremium) {
      return `${basePrompt}
      
      Analyze the ${testType.toUpperCase()} response against the 15 SSB traits: ${SSB_TRAITS.join(', ')}.
      
      For each trait, provide:
      - Score (1-10) with harsh but fair evaluation
      - Detailed description explaining the score
      
      Also provide:
      - A sample ideal response for the given prompt/situation
      - Specific areas for improvement
      - Actionable recommendations
      
      Return comprehensive analysis as JSON:
      {
        "overallScore": number (1-10, be strict),
        "traitScores": [{"trait": "trait_name", "score": number (1-10), "description": "detailed explanation"}],
        "strengths": ["specific strength1", "specific strength2"],
        "improvements": ["specific area1", "specific area2", "specific area3"],
        "recommendations": ["actionable recommendation1", "actionable recommendation2"],
        "officerLikeQualities": ["observed quality1", "observed quality2"],
        "sampleResponse": "A well-written example response for this prompt"
      }`;
    } else {
      return `${basePrompt}
      
      Provide a strict basic assessment focusing on overall performance.
      Include a sample response to show how it could be improved.
      
      Return analysis as JSON:
      {
        "overallScore": number (1-10, be very strict),
        "traitScores": [],
        "strengths": ["top strength1", "top strength2"],
        "improvements": ["key area1", "key area2", "key area3"],
        "recommendations": ["Upgrade to premium for detailed trait analysis"],
        "officerLikeQualities": ["basic quality1", "basic quality2"],
        "sampleResponse": "A sample ideal response for this prompt"
      }`;
    }
  }

  private getUserPrompt(testType: string, response: string, prompt?: string): string {
    let userPrompt = `Test Type: ${testType.toUpperCase()}\n`;
    if (prompt) {
      userPrompt += `Situation/Prompt: ${prompt}\n`;
    }
    userPrompt += `Candidate Response: "${response}"\n\n`;
    
    switch (testType) {
      case 'tat':
        userPrompt += `Evaluate this TAT story for creativity, psychological insight, character development, plot structure, and officer-like thinking. Be extremely strict - random text should score very low.`;
        break;
      case 'wat':
        userPrompt += `Evaluate this word association for positive thinking, officer-like qualities, and psychological appropriateness. Be strict - random words or inappropriate responses should score very low.`;
        break;
      case 'srt':
        userPrompt += `Evaluate this situation response for practical problem-solving, leadership approach, decision-making, and responsibility. Be harsh on vague or impractical responses.`;
        break;
      case 'ppdt':
        userPrompt += `Evaluate this PPDT discussion for logical thinking, positive approach, practical solutions, and leadership qualities. Be critical of superficial responses.`;
        break;
      default:
        userPrompt += `Evaluate this response according to strict SSB psychological assessment standards.`;
    }
    
    return userPrompt;
  }

  private formatFeedback(analysis: any, isPremium: boolean): AIFeedback {
    return {
      overallScore: analysis.overallScore || 3,
      traitScores: isPremium ? (analysis.traitScores || []) : [],
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      recommendations: analysis.recommendations || [],
      officerLikeQualities: analysis.officerLikeQualities || [],
      sampleResponse: analysis.sampleResponse || "Upgrade to premium to see sample responses",
    };
  }

  private getFallbackFeedback(): AIFeedback {
    return {
      overallScore: 3,
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
