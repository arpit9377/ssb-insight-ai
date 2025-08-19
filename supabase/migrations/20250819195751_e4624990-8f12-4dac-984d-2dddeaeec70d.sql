-- Fix OTP expiry security warning by setting appropriate expiry times
-- Update auth configuration to use recommended OTP expiry times
UPDATE auth.config SET 
  config_value = '3600' -- 1 hour instead of default longer expiry
WHERE 
  config_key = 'OTP_EXPIRY';

-- If the setting doesn't exist, insert it
INSERT INTO auth.config (config_key, config_value)
SELECT 'OTP_EXPIRY', '3600'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.config WHERE config_key = 'OTP_EXPIRY'
);