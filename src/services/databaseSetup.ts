
import { supabase } from '@/lib/supabase';

export const setupTestTables = async () => {
  try {
    // Check if test_sessions table exists, if not create it
    const { error: sessionError } = await supabase
      .from('test_sessions')
      .select('id')
      .limit(1);

    if (sessionError && sessionError.code === '42P01') {
      console.log('Creating test_sessions table...');
      // Table doesn't exist, will be created via SQL
    }

    // Check if ai_analyses table exists
    const { error: analysisError } = await supabase
      .from('ai_analyses')
      .select('id')
      .limit(1);

    if (analysisError && analysisError.code === '42P01') {
      console.log('Creating ai_analyses table...');
      // Table doesn't exist, will be created via SQL
    }

    // Check if user_analysis_usage table exists
    const { error: usageError } = await supabase
      .from('user_analysis_usage')
      .select('user_id')
      .limit(1);

    if (usageError && usageError.code === '42P01') {
      console.log('Creating user_analysis_usage table...');
      // Table doesn't exist, will be created via SQL
    }

  } catch (error) {
    console.error('Error setting up test tables:', error);
  }
};
