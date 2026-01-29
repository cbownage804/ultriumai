import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, DollarSign, FileText, PieChart, CreditCard
} from 'lucide-react';
import { ClientUsageDashboard } from './ClientUsageDashboard';
import { MRRCalculator } from './MRRCalculator';
import { AutomatedInvoicing } from './AutomatedInvoicing';
import { CostAllocationReports } from './CostAllocationReports';
import { ClientBillingPortal } from './ClientBillingPortal';

export function MSPBillingDashboard() {
  const [activeTab, setActiveTab] = useState('usage');

  const tabConfig = [
    { value: 'usage', label: 'Usage Metrics', icon: Activity },
    { value: 'mrr', label: 'MRR Calculator', icon: DollarSign },
    { value: 'invoicing', label: 'Invoicing', icon: FileText },
    { value: 'costs', label: 'Cost Allocation', icon: PieChart },
    { value: 'portal', label: 'Client Portal', icon: CreditCard }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/30 via-cyan-500/20 to-purple-500/30 border border-green-500/40 shadow-lg shadow-green-500/20">
            <DollarSign className="h-7 w-7 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-green-100 to-cyan-200 bg-clip-text text-transparent">
              MSP Billing Dashboard
            </h1>
            <p className="text-slate-400 text-sm">Multi-tenant usage tracking, invoicing, and revenue management</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-green-400 via-cyan-500 to-purple-600 text-white px-3 py-1">
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          Financial Hub
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto bg-black/60 border border-cyan-500/30 p-1">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:via-cyan-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-green-400 text-slate-400"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs lg:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="usage" className="mt-6">
          <ClientUsageDashboard />
        </TabsContent>

        <TabsContent value="mrr" className="mt-6">
          <MRRCalculator />
        </TabsContent>

        <TabsContent value="invoicing" className="mt-6">
          <AutomatedInvoicing />
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <CostAllocationReports />
        </TabsContent>

        <TabsContent value="portal" className="mt-6">
          <ClientBillingPortal />
        </TabsContent>
      </Tabs>
    </div>
  );
}
