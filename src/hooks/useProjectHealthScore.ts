import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface HealthMetric {
  name: string;
  score: number; // 0-100
  weight: number;
  details: string;
}

export function useProjectHealthScore() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [grade, setGrade] = useState<string>('—');
  const [isScanning, setIsScanning] = useState(false);

  const scan = useCallback((files: ProjectFile[]) => {
    setIsScanning(true);
    setTimeout(() => {
      const m: HealthMetric[] = [];

      // TypeScript usage
      const tsFiles = files.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
      const jsFiles = files.filter(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'));
      const tsRatio = tsFiles.length / Math.max(tsFiles.length + jsFiles.length, 1);
      m.push({ name: 'TypeScript Adoption', score: Math.round(tsRatio * 100), weight: 15, details: `${tsFiles.length} TS / ${jsFiles.length} JS files` });

      // Component size
      const componentFiles = files.filter(f => f.path.includes('/components/') && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')));
      const avgLines = componentFiles.length > 0 ? componentFiles.reduce((s, f) => s + f.content.split('\n').length, 0) / componentFiles.length : 0;
      const sizeScore = avgLines <= 100 ? 100 : avgLines <= 200 ? 80 : avgLines <= 400 ? 50 : 20;
      m.push({ name: 'Component Size', score: sizeScore, weight: 15, details: `Avg ${Math.round(avgLines)} lines/component` });

      // Test coverage presence
      const testFiles = files.filter(f => f.path.includes('.test.') || f.path.includes('.spec.'));
      const testScore = testFiles.length >= 10 ? 100 : testFiles.length >= 5 ? 70 : testFiles.length >= 1 ? 40 : 0;
      m.push({ name: 'Test Coverage', score: testScore, weight: 20, details: `${testFiles.length} test files found` });

      // Security patterns
      let secScore = 100;
      const allContent = files.map(f => f.content).join('\n');
      if (allContent.includes('dangerouslySetInnerHTML')) secScore -= 30;
      if (/eval\(/.test(allContent)) secScore -= 40;
      if (/password.*=.*['"]/.test(allContent)) secScore -= 30;
      m.push({ name: 'Security Patterns', score: Math.max(secScore, 0), weight: 20, details: secScore === 100 ? 'No issues found' : 'Potential security concerns detected' });

      // Code organization
      const hasSrcDir = files.some(f => f.path.startsWith('src/'));
      const hasComponents = files.some(f => f.path.includes('/components/'));
      const hasHooks = files.some(f => f.path.includes('/hooks/'));
      const orgScore = [hasSrcDir, hasComponents, hasHooks].filter(Boolean).length / 3 * 100;
      m.push({ name: 'Code Organization', score: Math.round(orgScore), weight: 15, details: `src:${hasSrcDir ? '✓' : '✗'} components:${hasComponents ? '✓' : '✗'} hooks:${hasHooks ? '✓' : '✗'}` });

      // Accessibility
      const a11yIssues = componentFiles.filter(f => f.content.includes('<img') && !f.content.includes('alt=')).length;
      const a11yScore = a11yIssues === 0 ? 100 : Math.max(0, 100 - a11yIssues * 20);
      m.push({ name: 'Accessibility', score: a11yScore, weight: 15, details: a11yIssues === 0 ? 'All images have alt text' : `${a11yIssues} images missing alt` });

      setMetrics(m);
      const total = m.reduce((s, met) => s + met.score * met.weight, 0) / m.reduce((s, met) => s + met.weight, 0);
      const rounded = Math.round(total);
      setOverallScore(rounded);
      setGrade(rounded >= 90 ? 'A' : rounded >= 80 ? 'B' : rounded >= 70 ? 'C' : rounded >= 60 ? 'D' : 'F');
      setIsScanning(false);
    }, 300);
  }, []);

  const generateCode = useCallback((): string => {
    return `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const metrics = ${JSON.stringify(metrics, null, 2)};

export function ProjectHealthDashboard() {
  const overall = ${overallScore};
  const grade = '${grade}';
  const gradeColor = grade === 'A' ? 'text-green-500' : grade === 'B' ? 'text-blue-500' : grade === 'C' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Project Health</p><p className="text-3xl font-bold">{overall}%</p></div>
          <span className={\`text-6xl font-black \${gradeColor}\`}>{grade}</span>
        </CardContent>
      </Card>
      {metrics.map((m, i) => (
        <Card key={i}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{m.name}</CardTitle>
            <Badge variant="outline">{m.score}%</Badge>
          </CardHeader>
          <CardContent>
            <Progress value={m.score} />
            <p className="text-xs text-muted-foreground mt-1">{m.details}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}`;
  }, [metrics, overallScore, grade]);

  return { metrics, overallScore, grade, isScanning, scan, generateCode };
}
