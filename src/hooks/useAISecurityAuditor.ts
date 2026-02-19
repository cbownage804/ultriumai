import { useState, useCallback } from 'react';

export interface SecurityFinding {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: 'xss' | 'injection' | 'auth' | 'exposure' | 'dependency' | 'config';
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  cwe?: string;
  remediation: string;
  autoFixable: boolean;
}

export interface AuditReport {
  score: number;
  findings: SecurityFinding[];
  scannedFiles: number;
  timestamp: string;
}

export function useAISecurityAuditor() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scan = useCallback((files: { path: string; content: string }[]) => {
    setIsScanning(true);
    const findings: SecurityFinding[] = [];
    let score = 100;

    for (const file of files) {
      // Check for innerHTML usage
      if (file.content.includes('dangerouslySetInnerHTML') || file.content.includes('innerHTML')) {
        findings.push({
          id: crypto.randomUUID(), severity: 'high', category: 'xss',
          title: 'Potential XSS via innerHTML', description: `${file.path} uses dangerouslySetInnerHTML or innerHTML`,
          filePath: file.path, cwe: 'CWE-79',
          remediation: 'Sanitize HTML with DOMPurify before rendering',
          autoFixable: true,
        });
        score -= 15;
      }
      // Check for hardcoded secrets
      if (/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}/i.test(file.content)) {
        findings.push({
          id: crypto.randomUUID(), severity: 'critical', category: 'exposure',
          title: 'Hardcoded secret detected', description: `${file.path} may contain hardcoded credentials`,
          filePath: file.path, cwe: 'CWE-798',
          remediation: 'Move secrets to environment variables',
          autoFixable: false,
        });
        score -= 25;
      }
      // Check for eval usage
      if (/\beval\s*\(/.test(file.content) || file.content.includes('new Function(')) {
        findings.push({
          id: crypto.randomUUID(), severity: 'high', category: 'injection',
          title: 'Code injection risk', description: `${file.path} uses eval() or new Function()`,
          filePath: file.path, cwe: 'CWE-94',
          remediation: 'Avoid eval/Function constructors; use safer alternatives',
          autoFixable: false,
        });
        score -= 20;
      }
      // Check for missing auth checks in API routes
      if (file.path.includes('functions/') && !file.content.includes('authorization') && !file.content.includes('auth')) {
        findings.push({
          id: crypto.randomUUID(), severity: 'medium', category: 'auth',
          title: 'Missing authentication check', description: `${file.path} may lack auth verification`,
          filePath: file.path, cwe: 'CWE-306',
          remediation: 'Add authorization header validation',
          autoFixable: true,
        });
        score -= 10;
      }
    }

    const newReport: AuditReport = {
      score: Math.max(0, score), findings, scannedFiles: files.length,
      timestamp: new Date().toISOString(),
    };
    setReport(newReport);
    setIsScanning(false);
    return newReport;
  }, []);

  const generateCode = useCallback(() => {
    return `// Security Middleware
import DOMPurify from 'dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function validateAuthHeader(req: Request): { valid: boolean; userId?: string } {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return { valid: false };
  const token = auth.slice(7);
  // Validate JWT token here
  return { valid: true, userId: 'extracted-from-token' };
}

export function rateLimitCheck(ip: string, limit = 100, windowMs = 60000): boolean {
  // Implement sliding window rate limiting
  return true;
}
`;
  }, []);

  return { report, isScanning, scan, generateCode };
}
