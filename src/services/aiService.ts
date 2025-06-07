
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
    this.currentProvider = 'gemini'; // Default to Gemini for development
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
        temperature: 0.3,
        maxOutputTokens: 2000,
      }
    };

    // Add image if provided (for PPDT/TAT)
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

    // Add image if provided (for PPDT/TAT)
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
        temperature: 0.3,
        max_tokens: 2000,
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
    const basePrompt = `You are an expert SSB psychological assessor specializing in ${testType.toUpperCase()} test evaluation.`;
    
    if (isPremium) {
      return `${basePrompt}
      Analyze the candidate's response and provide detailed feedback on the 15 SSB traits: ${SSB_TRAITS.join(', ')}.
      
      Evaluate Officer Like Qualities including:
      - Leadership potential and decision-making ability
      - Initiative, determination, and courage
      - Social adaptability and emotional stability
      - Planning, organization, and reasoning skills
      - Self-confidence and cooperation
      - Sense of responsibility and stamina
      
      Return comprehensive analysis as JSON with this structure:
      {
        "overallScore": number (1-10),
        "traitScores": [{"trait": "trait_name", "score": number (1-10), "description": "detailed explanation"}],
        "strengths": ["strength1", "strength2", "strength3"],
        "improvements": ["area1", "area2", "area3"],
        "recommendations": ["specific recommendation1", "specific recommendation2"],
        "officerLikeQualities": ["quality1", "quality2", "quality3"]
      }`;
    } else {
      return `${basePrompt}
      Provide a basic assessment focusing on overall performance and key areas.
      
      Return basic analysis as JSON with this structure:
      {
        "overallScore": number (1-10),
        "traitScores": [],
        "strengths": ["top strength1", "top strength2", "top strength3"],
        "improvements": ["key area1", "key area2", "key area3"],
        "recommendations": ["Upgrade to premium for detailed trait analysis and personalized recommendations"],
        "officerLikeQualities": ["basic quality1", "basic quality2"]
      }`;
    }
  }

  private getUserPrompt(testType: string, response: string, prompt?: string): string {
    let userPrompt = `Test Type: ${testType.toUpperCase()}\n`;
    if (prompt) {
      userPrompt += `Context/Prompt: ${prompt}\n`;
    }
    userPrompt += `Candidate Response: ${response}\n\nPlease analyze this response according to SSB psychological assessment standards.`;
    return userPrompt;
  }

  private formatFeedback(analysis: any, isPremium: boolean): AIFeedback {
    return {
      overallScore: analysis.overallScore || 5,
      traitScores: isPremium ? (analysis.traitScores || []) : [],
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      recommendations: analysis.recommendations || [],
      officerLikeQualities: analysis.officerLikeQualities || [],
    };
  }

  private getFallbackFeedback(): AIFeedback {
    return {
      overallScore: 6,
      traitScores: [],
      strengths: ['Good expression', 'Clear thinking', 'Positive approach'],
      improvements: ['More detailed responses', 'Better time management', 'Enhanced leadership focus'],
      recommendations: ['Practice more scenarios', 'Focus on officer-like qualities', 'Upgrade to premium for detailed analysis'],
      officerLikeQualities: ['Shows initiative', 'Demonstrates responsibility'],
    };
  }
}

export const aiService = new AIService();
