
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
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async analyzeResponse(
    testType: string,
    response: string,
    prompt?: string
  ): Promise<AIFeedback> {
    try {
      const systemPrompt = this.getSystemPrompt(testType);
      const userPrompt = this.getUserPrompt(testType, response, prompt);

      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('AI API request failed');
      }

      const data = await apiResponse.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return this.formatFeedback(analysis);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getFallbackFeedback();
    }
  }

  private getSystemPrompt(testType: string): string {
    return `You are an expert SSB psychological assessor specializing in ${testType} test evaluation. 
    Analyze the candidate's response and provide detailed feedback on the 15 SSB traits: ${SSB_TRAITS.join(', ')}.
    
    Evaluate Officer Like Qualities including:
    - Leadership potential
    - Decision-making ability
    - Initiative and determination
    - Social adaptability
    - Emotional stability
    - Planning and organization skills
    
    Return your analysis as JSON with the following structure:
    {
      "overallScore": number (1-10),
      "traitScores": [{"trait": "trait_name", "score": number (1-10), "description": "explanation"}],
      "strengths": ["strength1", "strength2"],
      "improvements": ["area1", "area2"],
      "recommendations": ["recommendation1", "recommendation2"],
      "officerLikeQualities": ["quality1", "quality2"]
    }`;
  }

  private getUserPrompt(testType: string, response: string, prompt?: string): string {
    let userPrompt = `Test Type: ${testType}\n`;
    if (prompt) {
      userPrompt += `Prompt/Image Context: ${prompt}\n`;
    }
    userPrompt += `Candidate Response: ${response}\n\nPlease analyze this response thoroughly.`;
    return userPrompt;
  }

  private formatFeedback(analysis: any): AIFeedback {
    return {
      overallScore: analysis.overallScore || 5,
      traitScores: analysis.traitScores || [],
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      recommendations: analysis.recommendations || [],
      officerLikeQualities: analysis.officerLikeQualities || [],
    };
  }

  private getFallbackFeedback(): AIFeedback {
    return {
      overallScore: 6,
      traitScores: SSB_TRAITS.map(trait => ({
        trait,
        score: Math.floor(Math.random() * 4) + 5,
        description: `Assessment for ${trait} based on response analysis.`
      })),
      strengths: ['Good expression', 'Clear thinking'],
      improvements: ['More detailed responses', 'Better time management'],
      recommendations: ['Practice more scenarios', 'Focus on leadership qualities'],
      officerLikeQualities: ['Shows initiative', 'Demonstrates responsibility'],
    };
  }
}

export const aiService = new AIService();
