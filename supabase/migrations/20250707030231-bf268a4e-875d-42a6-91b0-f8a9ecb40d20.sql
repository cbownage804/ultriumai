-- Fix profile ID mismatch to resolve RMM errors
UPDATE public.profiles 
SET id = user_id 
WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765' 
AND id != user_id;