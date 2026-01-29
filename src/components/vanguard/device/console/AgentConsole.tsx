import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceManager } from "./ServiceManager";
import { TaskManager } from "./TaskManager";
import { TerminalConsole } from "./TerminalConsole";
import { RegistryEditor } from "./RegistryEditor";
import { EventViewer } from "./EventViewer";
import { FileTransfer } from "./FileTransfer";
import { ProcessManager } from "./ProcessManager";
import { SoftwareInventory } from "./SoftwareInventory";
import {
  Settings,
  Activity,
  Terminal,
  Database,
  FileText,
  FolderOpen,
  Zap,
  Package,
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
      <TabsList className="grid grid-cols-8 w-full">
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
      </TabsList>

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
      </div>
    </Tabs>
  );
}
