import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ServiceManager } from "./ServiceManager";
import { TaskManager } from "./TaskManager";
import { TerminalConsole } from "./TerminalConsole";
import { RegistryEditor } from "./RegistryEditor";
import { EventViewer } from "./EventViewer";
import { FileTransfer } from "./FileTransfer";
import { ProcessManager } from "./ProcessManager";
import { SoftwareInventory } from "./SoftwareInventory";
import { ScheduledTasksManager } from "./ScheduledTasksManager";
import { FirewallRulesEditor } from "./FirewallRulesEditor";
import { CertificateManager } from "./CertificateManager";
import { EnvironmentVariables } from "./EnvironmentVariables";
import {
  Settings,
  Activity,
  Terminal,
  Database,
  FileText,
  FolderOpen,
  Zap,
  Package,
  Clock,
  Shield,
  ShieldCheck,
  Variable,
} from "lucide-react";

interface AgentConsoleProps {
  agentId: string;
  deviceName?: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
  currentMetrics?: { cpu: number; memory: number; disk: number; networkIn: number; networkOut: number };
}

export function AgentConsole({ agentId, deviceName, sendCommand, currentMetrics }: AgentConsoleProps) {
  const [activeTab, setActiveTab] = useState("processes");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList className="inline-flex w-auto min-w-full">
          <TabsTrigger value="processes" className="text-xs gap-1">
            <Zap className="h-3 w-3" />
            Processes
          </TabsTrigger>
          <TabsTrigger value="services" className="text-xs gap-1">
            <Settings className="h-3 w-3" />
            Services
          </TabsTrigger>
          <TabsTrigger value="terminal" className="text-xs gap-1">
            <Terminal className="h-3 w-3" />
            Terminal
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs gap-1">
            <FolderOpen className="h-3 w-3" />
            Files
          </TabsTrigger>
          <TabsTrigger value="software" className="text-xs gap-1">
            <Package className="h-3 w-3" />
            Software
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            Events
          </TabsTrigger>
          <TabsTrigger value="registry" className="text-xs gap-1">
            <Database className="h-3 w-3" />
            Registry
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs gap-1">
            <Activity className="h-3 w-3" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="firewall" className="text-xs gap-1">
            <Shield className="h-3 w-3" />
            Firewall
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs gap-1">
            <ShieldCheck className="h-3 w-3" />
            Certs
          </TabsTrigger>
          <TabsTrigger value="envvars" className="text-xs gap-1">
            <Variable className="h-3 w-3" />
            Env Vars
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="mt-4">
        <TabsContent value="processes">
          <ProcessManager agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="services">
          <ServiceManager agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="terminal">
          <TerminalConsole agentId={agentId} sendCommand={sendCommand} deviceName={deviceName} />
        </TabsContent>
        <TabsContent value="files">
          <FileTransfer agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="software">
          <SoftwareInventory agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="events">
          <EventViewer agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="registry">
          <RegistryEditor agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskManager agentId={agentId} sendCommand={sendCommand} currentMetrics={currentMetrics} />
        </TabsContent>
        <TabsContent value="scheduled">
          <ScheduledTasksManager agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="firewall">
          <FirewallRulesEditor agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificateManager agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
        <TabsContent value="envvars">
          <EnvironmentVariables agentId={agentId} sendCommand={sendCommand} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
