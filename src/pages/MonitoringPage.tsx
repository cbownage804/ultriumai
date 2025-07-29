import { RealTimeMonitor } from "@/components/rmm/RealTimeMonitor";
import { AlertCenter } from "@/components/rmm/AlertCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, AlertTriangle } from "lucide-react";

export default function MonitoringPage() {
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
        
        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Monitor className="h-4 w-4 mr-2" />
              Real-Time Monitor
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alert Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-6">
            <RealTimeMonitor />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}