import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  GitBranch,
  TrendingUp
} from 'lucide-react';
import { ScheduledScansManager } from '@/components/vanguard/ScheduledScansManager';
import { ComplianceReportGenerator } from '@/components/vanguard/ComplianceReportGenerator';
import { AttackPathVisualization } from '@/components/vanguard/AttackPathVisualization';
import { VanguardAnalyticsDashboard } from '@/components/vanguard/VanguardAnalyticsDashboard';

export default function VanguardReports() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive security reporting and trend analysis</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="analytics" className="flex items-center gap-2 py-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2 py-3">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Scheduled Scans</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Generate Report</span>
          </TabsTrigger>
          <TabsTrigger value="attack-path" className="flex items-center gap-2 py-3">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Attack Paths</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <VanguardAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledScansManager />
        </TabsContent>

        <TabsContent value="generate">
          <ComplianceReportGenerator />
        </TabsContent>

        <TabsContent value="attack-path">
          <AttackPathVisualization />
        </TabsContent>
      </Tabs>
    </div>
  );
}
