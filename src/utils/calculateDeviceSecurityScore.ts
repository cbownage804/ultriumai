/**
 * Calculate device security score based on security checks
 * Used in both DeviceSecurityTab and sidebar widget for consistency
 */

import { VanguardAgent } from "@/hooks/useVanguardAgents";

export interface SecurityScoreResult {
  score: number;
  checks: {
    antivirus: boolean;
    firewall: boolean;
    antispyware: boolean;
    tlsCompatible: boolean;
    bitlocker: boolean;
  };
  label: 'Protected' | 'At Risk' | 'Critical';
}

export function calculateDeviceSecurityScore(agent: VanguardAgent | null): SecurityScoreResult {
  if (!agent) {
    return {
      score: 0,
      checks: {
        antivirus: false,
        firewall: false,
        antispyware: false,
        tlsCompatible: false,
        bitlocker: false,
      },
      label: 'Critical',
    };
  }

  const osInfo = agent.config?.os || {};
  const configSecurity = agent.config?.security || {};
  const bitlockerStatus = (agent.config as any)?.bitlocker || [];
  
  // Get security_status from agent (populated by security_telemetry endpoint)
  const securityStatus = (agent as any).security_status || {};
  
  // Merge security info: prefer live security_status over config
  const firewallEnabled = securityStatus.firewall_enabled !== undefined 
    ? securityStatus.firewall_enabled 
    : (configSecurity.firewall_status?.toLowerCase() === 'enabled' || securityStatus.defender_enabled);
  
  const antivirusEnabled = securityStatus.defender_enabled || configSecurity.antivirus_status?.toLowerCase() === 'enabled';
  const antispywareEnabled = securityStatus.defender_enabled || configSecurity.antispyware_status?.toLowerCase() === 'enabled';
  const tlsCompatible = Boolean(osInfo.tls_compatible);
  
  // Check if any drive has BitLocker enabled
  const hasBitLockerEnabled = bitlockerStatus.some((drive: any) => 
    drive.protection_status === 'On' || drive.protection_status === 'Enabled'
  );

  const checks = {
    antivirus: antivirusEnabled,
    firewall: Boolean(firewallEnabled),
    antispyware: antispywareEnabled,
    tlsCompatible,
    bitlocker: hasBitLockerEnabled,
  };

  const checkValues = Object.values(checks);
  const score = Math.round((checkValues.filter(Boolean).length / checkValues.length) * 100);
  
  const label: SecurityScoreResult['label'] = 
    score >= 75 ? 'Protected' : 
    score >= 50 ? 'At Risk' : 
    'Critical';

  return { score, checks, label };
}
