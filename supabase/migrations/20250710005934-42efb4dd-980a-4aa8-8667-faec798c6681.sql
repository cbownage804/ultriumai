-- Remove all demo/sample data from the database

-- Remove demo SafePass data
DELETE FROM safepass_entries WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';
DELETE FROM safepass_vaults WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';

-- Remove demo Security Center data
DELETE FROM security_events WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';

-- Remove sample RMM data
DELETE FROM helpdesk_tickets WHERE customer_id IN (
  SELECT id FROM rmm_customers WHERE company_name IN ('Acme Corporation', 'TechStart LLC', 'Global Enterprises')
);
DELETE FROM rmm_devices WHERE customer_id IN (
  SELECT id FROM rmm_customers WHERE company_name IN ('Acme Corporation', 'TechStart LLC', 'Global Enterprises')
);
DELETE FROM rmm_customers WHERE company_name IN ('Acme Corporation', 'TechStart LLC', 'Global Enterprises');

-- Remove sample SafeAV data (only if auth.uid() matches)
DELETE FROM safe_av_scans WHERE user_id IS NOT NULL;
DELETE FROM safe_av_definitions WHERE user_id IS NOT NULL;

-- Remove sample SafeShield data
DELETE FROM safe_shield_endpoints WHERE user_id IS NOT NULL;

-- Remove sample SafeMDR data
DELETE FROM safe_mdr_alerts WHERE user_id IS NOT NULL;