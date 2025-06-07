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
      throw error;
    }

    return data.id;
  }

  // Update test session progress
  async updateTestSession(sessionId: string, completedQuestions: number, status?: string): Promise<void> {
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
    const { data, error } = await supabase
      .from('user_responses')
      .insert({
        user_id: userId,
        test_session_id: sessionId,
        question_id: questionId,
        response_text: responseText,
        time_taken: timeTaken,
        test_type: testType
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing response:', error);
      throw error;
    }

    return data.id;
  }

  // Check if user can get free analysis
  async canUserGetFreeAnalysis(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_analysis_usage')
      .select('free_analyses_used')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking analysis usage:', error);
      return false;
    }

    const freeUsed = data?.free_analyses_used || 0;
    return freeUsed < 2; // Allow 2 free analyses
  }

  // Update analysis usage
  async updateAnalysisUsage(userId: string, isFree: boolean): Promise<void> {
    const { data: existing } = await supabase
      .from('user_analysis_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

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

      if (error) console.error('Error updating analysis usage:', error);
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

      if (error) console.error('Error creating analysis usage:', error);
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
      console.log(`Analyzing individual response: ${responseId}`);
      
      const feedback = await aiService.analyzeResponse(testType, response, prompt, imageUrl, isPremium);
      
      const { data: responseData } = await supabase
        .from('user_responses')
        .select('test_session_id')
        .eq('id', responseId)
        .single();

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
          overall_score: feedback.overallScore,
          trait_scores: feedback.traitScores,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          recommendations: feedback.recommendations,
          is_premium_analysis: isPremium
        });

      if (error) {
        console.error('Error storing individual analysis:', error);
        throw error;
      }

      console.log(`Individual analysis completed for response: ${responseId}`);
    } catch (error) {
      console.error('Error in individual analysis:', error);
      throw error;
    }
  }

  // Analyze complete test session
  async analyzeTestSession(userId: string, sessionId: string, isPremium: boolean = false): Promise<any> {
    try {
      console.log(`Starting session analysis for: ${sessionId}`);

      // Get all responses for this session
      const { data: responses, error: responsesError } = await supabase
        .from('user_responses')
        .select('*')
        .eq('test_session_id', sessionId)
        .order('created_at');

      if (responsesError) throw responsesError;

      if (!responses || responses.length === 0) {
        throw new Error('No responses found for session');
      }

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Analyze each response individually
      for (const response of responses) {
        await this.analyzeIndividualResponse(
          userId,
          response.id,
          response.test_type,
          response.response_text,
          response.question_id,
          undefined, // imageUrl - will be added later for PPDT/TAT
          isPremium
        );
      }

      // Create session summary analysis
      const sessionSummary = await this.createSessionSummary(responses, session.test_type, isPremium);

      const { data: summaryAnalysis, error: summaryError } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: userId,
          test_session_id: sessionId,
          response_id: responses[0].id, // Use first response ID for session summary
          analysis_type: 'session_summary',
          ai_provider: aiService.getCurrentProvider(),
          raw_analysis: sessionSummary,
          processed_feedback: sessionSummary,
          overall_score: sessionSummary.overallScore,
          trait_scores: sessionSummary.traitScores,
          strengths: sessionSummary.strengths,
          improvements: sessionSummary.improvements,
          recommendations: sessionSummary.recommendations,
          is_premium_analysis: isPremium
        })
        .select()
        .single();

      if (summaryError) throw summaryError;

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
    const combinedResponses = responses.map(r => r.response_text).join('\n\n');
    const prompt = `Combined ${testType.toUpperCase()} test session with ${responses.length} responses`;
    
    return await aiService.analyzeResponse(testType, combinedResponses, prompt, undefined, isPremium);
  }

  // Get session analysis results
  async getSessionAnalysis(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('test_session_id', sessionId)
      .eq('analysis_type', 'session_summary')
      .single();

    if (error) {
      console.error('Error fetching session analysis:', error);
      return null;
    }

    return data;
  }

  // Get user's subscription status
  async getUserSubscription(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return !error && !!data;
  }
}

export const testAnalysisService = new TestAnalysisService();
