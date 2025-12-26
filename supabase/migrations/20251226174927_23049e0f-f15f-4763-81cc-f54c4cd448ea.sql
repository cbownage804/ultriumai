
-- Clear old test data from security tables for fresh start
-- Clear dependent tables first to avoid FK violations

-- Clear event correlations (references security_events)
DELETE FROM event_correlations;

-- Clear alert notifications (references security_events and alert_rules)
DELETE FROM alert_notifications;

-- Now clear main security tables
DELETE FROM security_events;
DELETE FROM audit_logs;
DELETE FROM security_incidents;

-- Clear EDR data
DELETE FROM edr_behavioral_analysis;
DELETE FROM edr_realtime_alerts;

-- Clear MDR/threat data
DELETE FROM safe_mdr_alerts;
DELETE FROM safeweb_threats;

-- Clear old pentest reports
DELETE FROM pentest_reports;

-- Clear old vulnerability scan data
DELETE FROM safenet_vulnerabilities;

-- Clear old compliance check results
DELETE FROM compliance_check_results;
DELETE FROM agentless_check_results;
