import { useState, useCallback } from 'react';

export interface Vulnerability {
  id: string;
  packageName: string;
  currentVersion: string;
  patchedVersion?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cveId?: string;
  description: string;
  publishedAt: Date;
}

export interface ScanResult {
  id: string;
  scannedAt: Date;
  totalPackages: number;
  vulnerabilities: Vulnerability[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export function useDependencyScanner() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanDependencies = useCallback((packages: { name: string; version: string }[]) => {
    setIsScanning(true);
    // Simulated vulnerability detection based on known patterns
    const vulns: Vulnerability[] = [];
    for (const pkg of packages) {
      const major = parseInt(pkg.version.replace(/[^0-9.]/g, '').split('.')[0] || '0');
      if (pkg.name.includes('lodash') && major < 5) {
        vulns.push({ id: crypto.randomUUID(), packageName: pkg.name, currentVersion: pkg.version, patchedVersion: '4.17.21', severity: 'high', cveId: 'CVE-2021-23337', description: 'Command injection via template function', publishedAt: new Date('2021-02-15') });
      }
    }

    const result: ScanResult = {
      id: crypto.randomUUID(),
      scannedAt: new Date(),
      totalPackages: packages.length,
      vulnerabilities: vulns,
      criticalCount: vulns.filter(v => v.severity === 'critical').length,
      highCount: vulns.filter(v => v.severity === 'high').length,
      mediumCount: vulns.filter(v => v.severity === 'medium').length,
      lowCount: vulns.filter(v => v.severity === 'low').length,
    };

    setScanResults(prev => [result, ...prev].slice(0, 50));
    setIsScanning(false);
    return result;
  }, []);

  const getLatestScan = useCallback(() => scanResults[0] || null, [scanResults]);

  const getSeverityBadge = useCallback((severity: Vulnerability['severity']) => {
    const colors = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-blue-500' };
    return colors[severity] || 'bg-gray-500';
  }, []);

  return { scanResults, isScanning, scanDependencies, getLatestScan, getSeverityBadge };
}
