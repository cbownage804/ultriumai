-- Clear out all test/fake security data to start with a clean live environment

-- Delete all security events (these are likely test data)
DELETE FROM public.security_events;

-- Delete all EDR alerts (these are likely test data) 
DELETE FROM public.edr_realtime_alerts;

-- Delete all incidents (these are likely test data)
DELETE FROM public.incidents;

-- Delete all EDR behavioral analysis data (these are likely test data)
DELETE FROM public.edr_behavioral_analysis;

-- Delete all compliance alerts (these are likely test data)
DELETE FROM public.compliance_alerts;

-- Reset compliance status scores to clean state
DELETE FROM public.compliance_status;

-- Delete any test threat intelligence data
DELETE FROM public.threat_intelligence_feeds WHERE feed_name LIKE '%test%' OR feed_name LIKE '%demo%' OR feed_name LIKE '%mock%';

-- Delete any test document/email scans
DELETE FROM public.document_scans;
DELETE FROM public.email_scans;

-- Delete any test antivirus scans
DELETE FROM public.antivirus_scans;

-- Clear any test automation logs
DELETE FROM public.automation_execution_logs;

-- Clear any test alert notifications
DELETE FROM public.alert_notifications;