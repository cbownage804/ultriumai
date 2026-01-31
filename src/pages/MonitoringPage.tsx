import { RealTimeMonitor } from "@/components/rmm/RealTimeMonitor";
import { AlertCenter } from "@/components/rmm/AlertCenter";
import { Monitor, AlertTriangle } from "lucide-react";
import { VanguardTabs, VanguardTabContent, VanguardTab } from "@/components/vanguard/shared";
import { useState } from "react";

const monitoringTabs: VanguardTab[] = [
  { id: 'monitor', label: 'Real-Time Monitor', icon: Monitor },
  { id: 'alerts', label: 'Alert Center', icon: AlertTriangle },
];

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('monitor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            System Monitoring & Alerts
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Real-time device monitoring and intelligent alerting system
          </p>
        </div>
        
        <VanguardTabs
          tabs={monitoringTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          colorTheme="cyan"
        >
          <VanguardTabContent value="monitor" className="space-y-6 mt-6">
            <RealTimeMonitor />
          </VanguardTabContent>

          <VanguardTabContent value="alerts" className="space-y-6 mt-6">
            <AlertCenter />
          </VanguardTabContent>
        </VanguardTabs>
      </div>
    </div>
  );
}