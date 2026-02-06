import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Shield, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function VanguardComply() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-8 w-8 text-teal-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Vanguard Comply</h1>
          <p className="text-sm text-white/60">Compliance & audit readiness center</p>
        </div>
        <Badge className="ml-auto bg-teal-500/20 text-teal-400 border-teal-500/30">Coming Soon</Badge>
      </div>

      {/* Placeholder framework scores */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { name: 'SOC 2 Type II', score: 0, icon: Shield },
          { name: 'HIPAA', score: 0, icon: FileText },
          { name: 'ISO 27001', score: 0, icon: CheckCircle },
          { name: 'PCI-DSS', score: 0, icon: AlertTriangle },
        ].map((fw) => (
          <Card key={fw.name} className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <fw.icon className="h-4 w-4 text-teal-400" />
                {fw.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white/40">{fw.score}%</div>
              <Progress value={fw.score} className="mt-2 h-2" />
              <p className="text-xs text-white/40 mt-2">Not configured</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Evidence Collection</CardTitle>
            <CardDescription className="text-white/50">
              Automated evidence gathering from connected systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">
              Configure compliance frameworks to begin evidence collection
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Audit Readiness</CardTitle>
            <CardDescription className="text-white/50">
              Track progress toward audit-ready status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">
              No active audit preparations
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
