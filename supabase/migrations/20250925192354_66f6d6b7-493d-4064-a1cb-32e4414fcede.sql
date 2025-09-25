-- Drop and recreate the update_user_streak function with better error handling
DROP FUNCTION IF EXISTS public.update_user_streak(text, text);

CREATE OR REPLACE FUNCTION public.update_user_streak(target_user_id text, activity_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - 1;
  streak_record user_streaks%ROWTYPE;
  points_earned INTEGER := 0;
BEGIN
  -- Log the function call for debugging
  RAISE NOTICE 'update_user_streak called for user_id: %, activity_type: %', target_user_id, activity_type;

  -- Handle login streak updates
  IF activity_type = 'login' THEN
    INSERT INTO public.user_streaks (user_id, current_login_streak, best_login_streak, last_login_date, total_points, updated_at)
    VALUES (target_user_id, 1, 1, today_date, 10, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      current_login_streak = CASE 
        WHEN user_streaks.last_login_date = yesterday_date THEN user_streaks.current_login_streak + 1
        WHEN user_streaks.last_login_date = today_date THEN user_streaks.current_login_streak
        ELSE 1
      END,
      best_login_streak = GREATEST(
        user_streaks.best_login_streak,
        CASE 
          WHEN user_streaks.last_login_date = yesterday_date THEN user_streaks.current_login_streak + 1
          WHEN user_streaks.last_login_date = today_date THEN user_streaks.current_login_streak
          ELSE 1
        END
      ),
      total_points = user_streaks.total_points + CASE
        WHEN user_streaks.last_login_date != today_date THEN 
          (CASE 
            WHEN user_streaks.last_login_date = yesterday_date THEN (user_streaks.current_login_streak + 1) * 10
            ELSE 10
          END)
        ELSE 0
      END,
      last_login_date = today_date,
      updated_at = NOW();

    -- Get the updated record
    SELECT * INTO streak_record FROM public.user_streaks WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Login streak updated for user: %, current_streak: %', target_user_id, streak_record.current_login_streak;
    
    RETURN json_build_object(
      'success', true,
      'current_streak', streak_record.current_login_streak,
      'best_streak', streak_record.best_login_streak,
      'total_points', streak_record.total_points,
      'activity_type', activity_type
    );
  END IF;

  -- Handle test streak updates  
  IF activity_type = 'test' THEN
    INSERT INTO public.user_streaks (user_id, current_test_streak, best_test_streak, last_test_date, total_points, updated_at)
    VALUES (target_user_id, 1, 1, today_date, 20, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      current_test_streak = CASE 
        WHEN user_streaks.last_test_date = yesterday_date THEN user_streaks.current_test_streak + 1
        WHEN user_streaks.last_test_date = today_date THEN user_streaks.current_test_streak
        ELSE 1
      END,
      best_test_streak = GREATEST(
        user_streaks.best_test_streak,
        CASE 
          WHEN user_streaks.last_test_date = yesterday_date THEN user_streaks.current_test_streak + 1
          WHEN user_streaks.last_test_date = today_date THEN user_streaks.current_test_streak
          ELSE 1
        END
      ),
      total_points = user_streaks.total_points + CASE
        WHEN user_streaks.last_test_date != today_date THEN 
          (CASE 
            WHEN user_streaks.last_test_date = yesterday_date THEN (user_streaks.current_test_streak + 1) * 20
            ELSE 20
          END)
        ELSE 0
      END,
      last_test_date = today_date,
      updated_at = NOW();

    -- Get the updated record
    SELECT * INTO streak_record FROM public.user_streaks WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Test streak updated for user: %, current_streak: %', target_user_id, streak_record.current_test_streak;
    
    RETURN json_build_object(
      'success', true,
      'current_streak', streak_record.current_test_streak,
      'best_streak', streak_record.best_test_streak,
      'total_points', streak_record.total_points,
      'activity_type', activity_type
    );
  END IF;

  RAISE NOTICE 'Unknown activity_type: % for user: %', activity_type, target_user_id;
  RETURN json_build_object('success', false, 'error', 'Unknown activity type');

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in update_user_streak for user % and activity %: %', target_user_id, activity_type, SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;