
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
  // Create a new test session
  async createTestSession(userId: string, testType: string, totalQuestions: number): Promise<string> {
    try {
      console.log('Creating test session for user:', userId);
      
      const { data, error } = await supabase
        .from('test_sessions')
        .insert({
          user_id: userId,
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
      if (!userId || !sessionId || !questionId) {
        throw new Error('Missing required parameters for storing response');
      }

      console.log('Storing response for session:', sessionId);

      const { data, error } = await supabase
        .from('user_responses')
        .insert({
          user_id: userId,
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
      if (!userId) {
        console.log('No user ID provided, defaulting to premium analysis');
        return false;
      }

      const { data, error } = await supabase
        .from('user_analysis_usage')
        .select('free_analyses_used')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking analysis usage:', error);
        return false;
      }

      const freeUsed = data?.free_analyses_used || 0;
      const canGetFree = freeUsed < 2;
      console.log(`User ${userId} has used ${freeUsed}/2 free analyses, can get free: ${canGetFree}`);
      
      return canGetFree;
    } catch (error) {
      console.error('Error checking free analysis eligibility:', error);
      return false;
    }
  }

  // Update analysis usage
  async updateAnalysisUsage(userId: string, isFree: boolean): Promise<void> {
    try {
      if (!userId) {
        console.log('No user ID provided, skipping usage update');
        return;
      }

      const { data: existing } = await supabase
        .from('user_analysis_usage')
        .select('*')
        .eq('user_id', userId)
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
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating analysis usage:', error);
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_analysis_usage')
          .insert({
            user_id: userId,
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

  // Analyze individual response
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
      if (!userId || !responseId || !response) {
        console.log('Skipping analysis due to missing required data');
        return;
      }

      console.log(`Analyzing individual response: ${responseId}`);
      
      const feedback = await aiService.analyzeResponse(testType, response, prompt, imageUrl, isPremium);
      
      const { data: responseData } = await supabase
        .from('user_responses')
        .select('test_session_id')
        .eq('id', responseId)
        .maybeSingle();

      // Store individual analysis
      const { error } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: userId,
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
      // Don't throw here to prevent stopping the overall flow
    }
  }

  // Analyze complete test session
  async analyzeTestSession(userId: string, sessionId: string, isPremium: boolean = false): Promise<any> {
    try {
      if (!userId || !sessionId) {
        throw new Error('Missing required parameters for session analysis');
      }

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
            userId,
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
          user_id: userId,
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
      await this.updateAnalysisUsage(userId, !isPremium);

      console.log(`Session analysis completed for: ${sessionId}`);
      return summaryAnalysis;

    } catch (error) {
      console.error('Error in session analysis:', error);
      throw error;
    }
  }

  // Create session summary from individual analyses
  private async createSessionSummary(responses: any[], testType: string, isPremium: boolean): Promise<any> {
    try {
      const combinedResponses = responses.map(r => r.response_text).join('\n\n');
      const prompt = `Combined ${testType.toUpperCase()} test session with ${responses.length} responses`;
      
      return await aiService.analyzeResponse(testType, combinedResponses, prompt, undefined, isPremium);
    } catch (error) {
      console.error('Error creating session summary:', error);
      // Return a basic summary if AI analysis fails
      return {
        overallScore: 75,
        traitScores: {},
        strengths: ['Completed the test'],
        improvements: ['Continue practicing'],
        recommendations: ['Review your responses']
      };
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
}

export const testAnalysisService = new TestAnalysisService();
