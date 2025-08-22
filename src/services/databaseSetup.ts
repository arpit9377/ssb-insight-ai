
import { supabase } from '@/integrations/supabase/client';

export const setupTestTables = async () => {
  try {
    console.log('Setting up test tables...');
    
    // Test if tables exist by trying to query them
    const { error: sessionError } = await supabase
      .from('test_sessions')
      .select('id')
      .limit(1);

    const { error: analysisError } = await supabase
      .from('ai_analyses')
      .select('id')
      .limit(1);

    const { error: usageError } = await supabase
      .from('user_analysis_usage')
      .select('user_id')
      .limit(1);

    if (sessionError) {
      console.log('test_sessions table check failed:', sessionError.message);
    } else {
      console.log('test_sessions table is ready');
    }

    if (analysisError) {
      console.log('ai_analyses table check failed:', analysisError.message);
    } else {
      console.log('ai_analyses table is ready');
    }

    if (usageError) {
      console.log('user_analysis_usage table check failed:', usageError.message);
    } else {
      console.log('user_analysis_usage table is ready');
    }

    console.log('Database setup complete');
    return true;

  } catch (error) {
    console.error('Error setting up test tables:', error);
    return false;
  }
};
