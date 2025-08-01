import { supabase } from '@/lib/supabase';
import { aiService } from './aiService';

interface TestSession {
  id: string;
  user_id: string;
  test_type: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  total_questions: number;
  completed_questions: number;
  started_at: string;
  completed_at?: string;
}

interface UserResponse {
  id: string;
  test_session_id: string;
  question_id: string;
  response_text: string;
  time_taken: number;
}

interface AnalysisUsage {
  user_id: string;
  free_analyses_used: number;
  total_analyses: number;
}

export class TestAnalysisService {
  // Get current authenticated user ID
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('No authenticated user found');
    }
    return user.id;
  }

  // Create a new test session
  async createTestSession(userId: string, testType: string, totalQuestions: number): Promise<string> {
    try {
      console.log('Creating test session for user:', userId);
      
      // Use Supabase user ID instead of Clerk user ID
      const supabaseUserId = await this.getCurrentUserId();
      
      const { data, error } = await supabase
        .from('test_sessions')
        .insert({
          user_id: supabaseUserId,
          test_type: testType,
          status: 'in_progress',
          total_questions: totalQuestions,
          completed_questions: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating test session:', error);
        throw new Error(`Failed to create test session: ${error.message}`);
      }

      if (!data?.id) {
        throw new Error('No session ID returned from database');
      }

      console.log('Test session created successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create test session:', error);
      throw error;
    }
  }

  // Update test session progress
  async updateTestSession(sessionId: string, completedQuestions: number, status?: string): Promise<void> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const updateData: any = { 
        completed_questions: completedQuestions,
        updated_at: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
        if (status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('test_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating test session:', error);
        throw new Error(`Failed to update test session: ${error.message}`);
      }

      console.log('Test session updated successfully');
    } catch (error) {
      console.error('Failed to update test session:', error);
      throw error;
    }
  }

  // Store individual response
  async storeResponse(
    userId: string,
    sessionId: string,
    questionId: string,
    responseText: string,
    timeTaken: number,
    testType: string
  ): Promise<string> {
    try {
      if (!sessionId || !questionId) {
        throw new Error('Missing required parameters for storing response');
      }

      console.log('Storing response for session:', sessionId);

      // Get current authenticated user from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }

      const supabaseUserId = user?.id;
      if (!supabaseUserId) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('user_responses')
        .insert({
          user_id: supabaseUserId,
          test_session_id: sessionId,
          question_id: questionId,
          response_text: responseText || '',
          time_taken: timeTaken || 0,
          test_type: testType
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing response:', error);
        throw new Error(`Failed to store response: ${error.message}`);
      }

      if (!data?.id) {
        throw new Error('No response ID returned from database');
      }

      console.log('Response stored successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to store response:', error);
      throw error;
    }
  }

  // Check if user can get free analysis
  async canUserGetFreeAnalysis(userId: string): Promise<boolean> {
    try {
      // Use Supabase user ID
      const supabaseUserId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('user_analysis_usage')
        .select('free_analyses_used')
        .eq('user_id', supabaseUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking analysis usage:', error);
        return false;
      }

      const freeUsed = data?.free_analyses_used || 0;
      const canGetFree = freeUsed < 2;
      console.log(`User ${supabaseUserId} has used ${freeUsed}/2 free analyses, can get free: ${canGetFree}`);
      
      return canGetFree;
    } catch (error) {
      console.error('Error checking free analysis eligibility:', error);
      return false;
    }
  }

  // Update analysis usage
  async updateAnalysisUsage(userId: string, isFree: boolean): Promise<void> {
    try {
      // Use Supabase user ID
      const supabaseUserId = await this.getCurrentUserId();

      const { data: existing } = await supabase
        .from('user_analysis_usage')
        .select('*')
        .eq('user_id', supabaseUserId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const updateData: any = {
          total_analyses: existing.total_analyses + 1,
          updated_at: new Date().toISOString()
        };

        if (isFree) {
          updateData.free_analyses_used = existing.free_analyses_used + 1;
          updateData.last_free_analysis_date = new Date().toISOString().split('T')[0];
        }

        const { error } = await supabase
          .from('user_analysis_usage')
          .update(updateData)
          .eq('user_id', supabaseUserId);

        if (error) {
          console.error('Error updating analysis usage:', error);
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_analysis_usage')
          .insert({
            user_id: supabaseUserId,
            free_analyses_used: isFree ? 1 : 0,
            total_analyses: 1,
            last_free_analysis_date: isFree ? new Date().toISOString().split('T')[0] : null
          });

        if (error) {
          console.error('Error creating analysis usage:', error);
        }
      }
    } catch (error) {
      console.error('Error updating analysis usage:', error);
    }
  }

  // Analyze individual response with improved prompts
  async analyzeIndividualResponse(
    userId: string,
    responseId: string,
    testType: string,
    response: string,
    prompt?: string,
    imageUrl?: string,
    isPremium: boolean = false
  ): Promise<void> {
    try {
      if (!responseId || !response) {
        console.log('Skipping analysis due to missing required data');
        return;
      }

      // Use Supabase user ID
      const supabaseUserId = await this.getCurrentUserId();

      console.log(`Analyzing individual response: ${responseId}`);
      
      // Get the actual prompt/content for context
      let contextPrompt = prompt;
      if (testType === 'wat') {
        const { data: wordData } = await supabase
          .from('wat_words')
          .select('word')
          .eq('id', prompt)
          .single();
        contextPrompt = wordData?.word || prompt;
      } else if (testType === 'srt') {
        const { data: situationData } = await supabase
          .from('srt_situations')
          .select('situation')
          .eq('id', prompt)
          .single();
        contextPrompt = situationData?.situation || prompt;
      } else if (testType === 'tat') {
        const { data: imageData } = await supabase
          .from('test_images')
          .select('prompt, image_url')
          .eq('id', prompt)
          .single();
        contextPrompt = imageData?.prompt || prompt;
        imageUrl = imageData?.image_url || imageUrl;
      }
      
      const feedback = await aiService.analyzeResponse(testType, response, contextPrompt, imageUrl, isPremium);
      
      const { data: responseData } = await supabase
        .from('user_responses')
        .select('test_session_id')
        .eq('id', responseId)
        .maybeSingle();

      const { error } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: supabaseUserId,
          test_session_id: responseData?.test_session_id,
          response_id: responseId,
          analysis_type: 'individual',
          ai_provider: aiService.getCurrentProvider(),
          raw_analysis: feedback,
          processed_feedback: feedback,
          overall_score: feedback.overallScore || 0,
          trait_scores: feedback.traitScores || {},
          strengths: feedback.strengths || [],
          improvements: feedback.improvements || [],
          recommendations: feedback.recommendations || [],
          is_premium_analysis: isPremium
        });

      if (error) {
        console.error('Error storing individual analysis:', error);
        throw error;
      }

      console.log(`Individual analysis completed for response: ${responseId}`);
    } catch (error) {
      console.error('Error in individual analysis:', error);
    }
  }

  // Analyze complete test session
  async analyzeTestSession(userId: string, sessionId: string, isPremium: boolean = false): Promise<any> {
    try {
      if (!sessionId) {
        throw new Error('Missing required parameters for session analysis');
      }

      // Use Supabase user ID
      const supabaseUserId = await this.getCurrentUserId();

      console.log(`Starting session analysis for: ${sessionId}`);

      // Get all responses for this session
      const { data: responses, error: responsesError } = await supabase
        .from('user_responses')
        .select('*')
        .eq('test_session_id', sessionId)
        .order('created_at');

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        throw responsesError;
      }

      if (!responses || responses.length === 0) {
        console.log('No responses found for session, skipping analysis');
        return null;
      }

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        throw sessionError;
      }

      // Analyze each response individually
      for (const response of responses) {
        try {
          await this.analyzeIndividualResponse(
            supabaseUserId,
            response.id,
            response.test_type,
            response.response_text,
            response.question_id,
            undefined,
            isPremium
          );
        } catch (error) {
          console.error(`Failed to analyze response ${response.id}:`, error);
          // Continue with other responses
        }
      }

      // Create session summary analysis
      const sessionSummary = await this.createSessionSummary(responses, session.test_type, isPremium);

      const { data: summaryAnalysis, error: summaryError } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: supabaseUserId,
          test_session_id: sessionId,
          response_id: responses[0].id,
          analysis_type: 'session_summary',
          ai_provider: aiService.getCurrentProvider(),
          raw_analysis: sessionSummary,
          processed_feedback: sessionSummary,
          overall_score: sessionSummary.overallScore || 0,
          trait_scores: sessionSummary.traitScores || {},
          strengths: sessionSummary.strengths || [],
          improvements: sessionSummary.improvements || [],
          recommendations: sessionSummary.recommendations || [],
          is_premium_analysis: isPremium
        })
        .select()
        .single();

      if (summaryError) {
        console.error('Error storing session summary:', summaryError);
        throw summaryError;
      }

      // Update analysis usage
      await this.updateAnalysisUsage(supabaseUserId, !isPremium);

      console.log(`Session analysis completed for: ${sessionId}`);
      return summaryAnalysis;

    } catch (error) {
      console.error('Error in session analysis:', error);
      throw error;
    }
  }

  // Create session summary with improved analysis
  private async createSessionSummary(responses: any[], testType: string, isPremium: boolean): Promise<any> {
    try {
      // Get all individual analyses for better summary
      const analysisPromises = responses.slice(0, 5).map(async (response) => {
        const contextPrompt = await this.getContextPrompt(response.question_id, testType);
        return await aiService.analyzeResponse(testType, response.response_text, contextPrompt, undefined, isPremium);
      });
      
      const individualAnalyses = await Promise.all(analysisPromises);
      
      // Calculate average scores and combine insights
      const avgScore = individualAnalyses.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / individualAnalyses.length;
      const allStrengths = individualAnalyses.flatMap(a => a.strengths || []);
      const allImprovements = individualAnalyses.flatMap(a => a.improvements || []);
      const allRecommendations = individualAnalyses.flatMap(a => a.recommendations || []);
      
      return {
        overallScore: Math.round(avgScore),
        traitScores: isPremium ? individualAnalyses[0]?.traitScores || {} : {},
        strengths: [...new Set(allStrengths)].slice(0, 5),
        improvements: [...new Set(allImprovements)].slice(0, 5),
        recommendations: [...new Set(allRecommendations)].slice(0, 5),
        officerLikeQualities: individualAnalyses.flatMap(a => a.officerLikeQualities || []).slice(0, 3),
        sampleResponse: individualAnalyses[0]?.sampleResponse || "Upgrade to premium for sample responses"
      };
    } catch (error) {
      console.error('Error creating session summary:', error);
      return {
        overallScore: 4,
        traitScores: {},
        strengths: ['Completed the test'],
        improvements: ['Focus on quality responses', 'Show more officer-like thinking'],
        recommendations: ['Practice more structured responses', 'Study leadership qualities'],
        sampleResponse: "A good response would show clear thinking and practical solutions"
      };
    }
  }

  private async getContextPrompt(questionId: string, testType: string): Promise<string> {
    try {
      if (testType === 'wat') {
        const { data } = await supabase
          .from('wat_words')
          .select('word')
          .eq('id', questionId)
          .single();
        return data?.word || questionId;
      } else if (testType === 'srt') {
        const { data } = await supabase
          .from('srt_situations')
          .select('situation')
          .eq('id', questionId)
          .single();
        return data?.situation || questionId;
      } else if (testType === 'tat') {
        const { data } = await supabase
          .from('test_images')
          .select('prompt')
          .eq('id', questionId)
          .single();
        return data?.prompt || questionId;
      }
      return questionId;
    } catch (error) {
      return questionId;
    }
  }

  // Add to recent activity (keep last 3)
  async addToRecentActivity(userId: string, analysisData: any): Promise<void> {
    try {
      if (!userId || !analysisData) return;

      // Get current recent activity
      const { data: existing } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('analysis_type', 'session_summary')
        .order('created_at', { ascending: false })
        .limit(3);

      // If we have 3 or more, delete the oldest
      if (existing && existing.length >= 3) {
        const toDelete = existing.slice(2); // Keep first 2, delete rest
        for (const item of toDelete) {
          await supabase
            .from('ai_analyses')
            .delete()
            .eq('id', item.id);
        }
      }
    } catch (error) {
      console.error('Error managing recent activity:', error);
    }
  }

  // Get recent activity
  async getRecentActivity(userId: string): Promise<any[]> {
    try {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('analysis_type', 'session_summary')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Get session analysis results
  async getSessionAnalysis(sessionId: string): Promise<any> {
    try {
      if (!sessionId) {
        return null;
      }

      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('test_session_id', sessionId)
        .eq('analysis_type', 'session_summary')
        .maybeSingle();

      if (error) {
        console.error('Error fetching session analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting session analysis:', error);
      return null;
    }
  }

  // Get user's subscription status
  async getUserSubscription(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        return false;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  async analyzeTATSession(
    userId: string,
    sessionId: string,
    isPremium: boolean,
    images: any[],
    responses: string[]
  ): Promise<void> {
    try {
      console.log(`Starting TAT batch analysis for session ${sessionId}`);
      
      // Prepare batch analysis data
      const batchData = images.map((image, index) => ({
        imageNumber: index + 1,
        imageUrl: image.image_url || null,
        prompt: image.prompt,
        response: responses[index],
        isBlankSlide: image.id === 'blank-slide'
      }));

      // Single API call for all TAT responses
      const analysis = await aiService.analyzeTATBatch(batchData, isPremium);

      // Store the comprehensive analysis
      await this.storeComprehensiveAnalysis(userId, sessionId, 'tat', analysis, isPremium);

      console.log('TAT batch analysis completed successfully');
    } catch (error) {
      console.error('Error in TAT batch analysis:', error);
      throw error;
    }
  }

  async analyzeWATBatch(
    userId: string,
    sessionId: string,
    isPremium: boolean,
    words: any[],
    responses: string[]
  ): Promise<void> {
    try {
      console.log(`Starting WAT batch analysis for session ${sessionId}`);
      
      // Prepare batch analysis data
      const batchData = words.map((word, index) => ({
        word: word.word,
        response: responses[index]
      }));

      // Single API call for all WAT responses
      const analysis = await aiService.analyzeWATBatch(batchData, isPremium);

      // Store the comprehensive analysis
      await this.storeComprehensiveAnalysis(userId, sessionId, 'wat', analysis, isPremium);

      console.log('WAT batch analysis completed successfully');
    } catch (error) {
      console.error('Error in WAT batch analysis:', error);
      throw error;
    }
  }

  async analyzeSRTBatch(
    userId: string,
    sessionId: string,
    isPremium: boolean,
    situations: any[],
    responses: string[]
  ): Promise<void> {
    try {
      console.log(`Starting SRT batch analysis for session ${sessionId}`);
      
      const batchData = situations.map((situation, index) => ({
        situation: situation.situation,
        response: responses[index]
      }));

      const analysis = await aiService.analyzeSRTBatch(batchData, isPremium);
      await this.storeComprehensiveAnalysis(userId, sessionId, 'srt', analysis, isPremium);

      console.log('SRT batch analysis completed successfully');
    } catch (error) {
      console.error('Error in SRT batch analysis:', error);
      throw error;
    }
  }

  private async storeComprehensiveAnalysis(
    userId: string,
    sessionId: string,
    testType: string,
    analysis: any,
    isPremium: boolean
  ): Promise<void> {
    try {
      console.log('Storing comprehensive analysis for session:', sessionId);
      console.log('Analysis data:', JSON.stringify(analysis, null, 2));

      // Use Supabase user ID
      const supabaseUserId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: supabaseUserId,
          test_session_id: sessionId,
          analysis_type: testType,
          ai_provider: 'openai',
          raw_analysis: analysis,
          processed_feedback: analysis,
          overall_score: analysis.overallScore || 0,
          trait_scores: analysis.traitScores || {},
          strengths: analysis.strengths || [],
          improvements: analysis.improvements || [],
          recommendations: analysis.recommendations || [],
          is_premium_analysis: isPremium
        });

      if (error) {
        console.error('Error storing comprehensive analysis:', error);
        console.error('Attempted to store:', {
          user_id: supabaseUserId,
          test_session_id: sessionId,
          analysis_type: testType,
          ai_provider: 'openai',
          overall_score: analysis.overallScore || 0,
          is_premium_analysis: isPremium
        });
        throw error;
      }

      console.log('Analysis stored successfully');

      // Update usage tracking
      await this.updateAnalysisUsage(supabaseUserId, isPremium);
    } catch (error) {
      console.error('Failed to store comprehensive analysis:', error);
      throw error;
    }
  }
}

export const testAnalysisService = new TestAnalysisService();
