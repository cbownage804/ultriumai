import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { devLog } from '@/lib/logger';

// Demo notification creator for testing
export const useNotificationDemo = () => {
  const { createNotification, createSecurityAlert } = useNotifications();

  const createDemoNotifications = async () => {
    // Create sample notifications
    const notifications = [
      {
        title: 'Security Scan Complete',
        message: 'Your scheduled security scan has completed successfully. No threats detected.',
        type: 'success' as const,
        category: 'security' as const,
        metadata: { scan_id: 'scan_123', threats_found: 0 }
      },
      {
        title: 'Password Expiration Warning',
        message: 'Your password for the main admin account will expire in 7 days.',
        type: 'warning' as const,
        category: 'security' as const,
        action_url: '/dashboard/safepass',
        metadata: { account: 'admin@example.com', days_remaining: 7 }
      },
      {
        title: 'New Device Login',
        message: 'A new device has been used to access your account from San Francisco, CA.',
        type: 'info' as const,
        category: 'security' as const,
        metadata: { device: 'iPhone 15', location: 'San Francisco, CA', ip: '192.168.1.100' }
      }
    ];

    // Create sample security alerts
    const alerts = [
      {
        alert_type: 'malware_detection',
        title: 'Malware Detection on Workstation',
        description: 'Suspicious executable detected on workstation WS-001. The file has been quarantined automatically.',
        severity: 'high' as const,
        metadata: {
          source_system: 'endpoint_protection',
          affected_systems: ['WS-001', 'File Server'],
          indicators: {
            file_hash: 'a1b2c3d4e5f6',
            file_path: 'C:\\Downloads\\suspicious.exe',
            detection_engine: 'SafeScan Pro'
          },
          remediation_steps: '1. Verify the file is safely quarantined\n2. Run full system scan\n3. Check for similar files on network'
        }
      },
      {
        alert_type: 'network_intrusion',
        title: 'Suspicious Network Activity',
        description: 'Unusual network traffic patterns detected from external IP address. Possible reconnaissance attempt.',
        severity: 'critical' as const,
        metadata: {
          source_system: 'network_monitor',
          affected_systems: ['Firewall', 'Web Server'],
          indicators: {
            source_ip: '203.0.113.45',
            packets_per_second: 15000,
            attack_pattern: 'port_scan'
          },
          remediation_steps: '1. Block source IP at firewall\n2. Review server logs\n3. Check for data exfiltration'
        }
      }
    ];

    try {
      // Create notifications
      for (const notification of notifications) {
        await createNotification(notification);
      }

      // Create security alerts
      for (const alert of alerts) {
        await createSecurityAlert(alert);
      }

      devLog.log('Demo notifications and alerts created successfully');
    } catch (error) {
      devLog.error('Error creating demo notifications:', error);
    }
  };

  return { createDemoNotifications };
};

// Component to trigger demo notifications (for development)
export const NotificationDemo = () => {
  const { createDemoNotifications } = useNotificationDemo();

  useEffect(() => {
    // Uncomment to create demo notifications on component mount
    // createDemoNotifications();
  }, []);

  return null;
};