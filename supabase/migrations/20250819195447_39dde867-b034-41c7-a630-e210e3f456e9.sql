-- Create table to track OpenAI API usage and errors
CREATE TABLE public.openai_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN ('success', 'rate_limit', 'quota_exceeded', 'error')),
  error_code TEXT,
  error_message TEXT,
  request_type TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10,4) DEFAULT 0,
  response_time_ms INTEGER,
  model_used TEXT,
  is_premium_request BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.openai_api_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (for edge functions)
CREATE POLICY "Service role can manage all API logs" 
ON public.openai_api_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policy for admins to view logs
CREATE POLICY "Admins can view API logs" 
ON public.openai_api_logs 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_openai_logs_created_at ON public.openai_api_logs(created_at DESC);
CREATE INDEX idx_openai_logs_event_type ON public.openai_api_logs(event_type);

-- Create function to get API usage summary
CREATE OR REPLACE FUNCTION public.get_openai_api_summary(hours_back INTEGER DEFAULT 24)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
  total_requests INTEGER;
  error_count INTEGER;
  rate_limit_count INTEGER;
  quota_exceeded_count INTEGER;
  success_rate DECIMAL;
BEGIN
  -- Get summary stats for the specified time period
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE event_type IN ('rate_limit', 'quota_exceeded', 'error')) as errors,
    COUNT(*) FILTER (WHERE event_type = 'rate_limit') as rate_limits,
    COUNT(*) FILTER (WHERE event_type = 'quota_exceeded') as quota_exceeded
  INTO total_requests, error_count, rate_limit_count, quota_exceeded_count
  FROM public.openai_api_logs
  WHERE created_at >= NOW() - (hours_back || ' hours')::INTERVAL;

  -- Calculate success rate
  IF total_requests > 0 THEN
    success_rate = (total_requests - error_count)::DECIMAL / total_requests * 100;
  ELSE
    success_rate = 100;
  END IF;

  SELECT json_build_object(
    'total_requests', COALESCE(total_requests, 0),
    'error_count', COALESCE(error_count, 0),
    'rate_limit_count', COALESCE(rate_limit_count, 0),
    'quota_exceeded_count', COALESCE(quota_exceeded_count, 0),
    'success_rate', ROUND(success_rate, 2),
    'hours_back', hours_back,
    'last_error', (
      SELECT json_build_object(
        'created_at', created_at,
        'error_code', error_code,
        'error_message', error_message
      )
      FROM public.openai_api_logs 
      WHERE event_type IN ('rate_limit', 'quota_exceeded', 'error')
      ORDER BY created_at DESC 
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$function$;