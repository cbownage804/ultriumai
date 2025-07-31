import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

// Demo component to create sample notifications and alerts
export const NotificationTester = () => {
  const { createNotification, createSecurityAlert } = useNotifications();

  const createSampleNotifications = async () => {
    // Create sample notifications
    await createNotification({
      title: 'Security Scan Complete',
      message: 'Your scheduled security scan has completed successfully. No threats detected.',
      type: 'success',
      category: 'security',
      severity: 'low',
      read: false,
      acknowledged: false,
      metadata: { scan_id: 'scan_123', threats_found: 0 }
    });

    await createNotification({
      title: 'Password Expiration Warning',
      message: 'Your password for the main admin account will expire in 7 days.',
      type: 'warning',
      category: 'security',
      severity: 'medium',
      read: false,
      acknowledged: false,
      action_url: '/dashboard/safepass',
      metadata: { account: 'admin@example.com', days_remaining: 7 }
    });

    await createNotification({
      title: 'New Device Login',
      message: 'A new device has been used to access your account from San Francisco, CA.',
      type: 'info',
      category: 'security',
      severity: 'medium',
      read: false,
      acknowledged: false,
      metadata: { device: 'iPhone 15', location: 'San Francisco, CA', ip: '192.168.1.100' }
    });
  };

  const createSampleAlerts = async () => {
    // Create sample security alerts
    await createSecurityAlert({
      alert_type: 'malware_detection',
      title: 'Malware Detection on Workstation',
      description: 'Suspicious executable detected on workstation WS-001. The file has been quarantined automatically.',
      severity: 'high',
      status: 'active',
      source_system: 'endpoint_protection',
      affected_systems: ['WS-001', 'File Server'],
      indicators: {
        file_hash: 'a1b2c3d4e5f6',
        file_path: 'C:\\Downloads\\suspicious.exe',
        detection_engine: 'SafeScan Pro'
      },
      remediation_steps: '1. Verify the file is safely quarantined\n2. Run full system scan\n3. Check for similar files on network'
    });

    await createSecurityAlert({
      alert_type: 'network_intrusion',
      title: 'Suspicious Network Activity',
      description: 'Unusual network traffic patterns detected from external IP address. Possible reconnaissance attempt.',
      severity: 'critical',
      status: 'active',
      source_system: 'network_monitor',
      affected_systems: ['Firewall', 'Web Server'],
      indicators: {
        source_ip: '203.0.113.45',
        packets_per_second: 15000,
        attack_pattern: 'port_scan'
      },
      remediation_steps: '1. Block source IP at firewall\n2. Review server logs\n3. Check for data exfiltration'
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Notification System Tester</h3>
      <div className="flex gap-2">
        <Button onClick={createSampleNotifications}>
          Create Sample Notifications
        </Button>
        <Button onClick={createSampleAlerts} variant="outline">
          Create Sample Alerts
        </Button>
      </div>
    </div>
  );
};