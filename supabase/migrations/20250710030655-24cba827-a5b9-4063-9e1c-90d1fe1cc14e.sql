-- Remove all demo/sample data from SafeShield products

-- Remove sample SafeShield endpoints
DELETE FROM public.safe_shield_endpoints WHERE user_id IS NOT NULL;

-- Remove sample AV definitions
DELETE FROM public.safe_av_definitions WHERE user_id IS NOT NULL;

-- Remove sample AV scans  
DELETE FROM public.safe_av_scans WHERE user_id IS NOT NULL;

-- Remove sample MDR alerts
DELETE FROM public.safe_mdr_alerts WHERE user_id IS NOT NULL;