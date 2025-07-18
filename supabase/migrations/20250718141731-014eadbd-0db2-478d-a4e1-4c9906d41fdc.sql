-- Remove all demo/sample data from SafeNet tables

-- Remove sample SafeNet devices
DELETE FROM public.safenet_devices WHERE user_id IS NOT NULL;

-- Remove sample SafeNet vulnerabilities  
DELETE FROM public.safenet_vulnerabilities WHERE user_id IS NOT NULL;

-- Remove sample SafeNet networks
DELETE FROM public.safenet_networks WHERE user_id IS NOT NULL;

-- Remove sample network scans
DELETE FROM public.network_scans WHERE user_id IS NOT NULL;

-- Remove sample SafeNet scans
DELETE FROM public.safenet_scans WHERE user_id IS NOT NULL;

-- Remove sample network assets
DELETE FROM public.network_assets WHERE user_id IS NOT NULL;

-- Remove sample SafeWeb data
DELETE FROM public.safeweb_assets WHERE user_id IS NOT NULL;
DELETE FROM public.safeweb_threats WHERE user_id IS NOT NULL;