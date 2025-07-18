-- Remove all demo/sample data from SafeNet tables

-- Remove sample SafeNet assets
DELETE FROM public.safenet_assets WHERE user_id IS NOT NULL;

-- Remove sample SafeNet vulnerabilities  
DELETE FROM public.safenet_vulnerabilities WHERE user_id IS NOT NULL;

-- Remove sample SafeNet devices
DELETE FROM public.safenet_devices WHERE user_id IS NOT NULL;

-- Remove sample SafeNet networks
DELETE FROM public.safenet_networks WHERE user_id IS NOT NULL;

-- Remove sample network scans
DELETE FROM public.network_scans WHERE user_id IS NOT NULL;

-- Remove sample SafeNet connectors (except the one we just created)
DELETE FROM public.safenet_connectors WHERE user_id IS NOT NULL AND connector_key != 'sk-safenet-b8cfe427-ki4d01';