import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Zap, BarChart3, FileText, Clock, Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";

// Import our advanced components
import { CustomFieldsManager } from "@/components/admin/CustomFieldsManager";
import { WorkflowAutomationManager } from "@/components/admin/WorkflowAutomationManager";
import { SLAPoliciesManager } from "@/components/admin/SLAPoliciesManager";
import { TicketTemplatesManager } from "@/components/admin/TicketTemplatesManager";
import { AdvancedTicketDashboard } from "@/components/admin/AdvancedTicketDashboard";
import { AutomationEngine } from "@/components/admin/AutomationEngine";

// Import existing helpdesk system
import { AIHelpdeskSystem } from "@/components/AIHelpdeskSystem";

export default function AdvancedHelpdeskAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Advanced Helpdesk Administration
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive ticket management with AI-powered automation
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Enterprise Features
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Live Tickets
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            SLA Policies
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Custom Fields
          </TabsTrigger>
          <TabsTrigger value="engine" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Engine
          </TabsTrigger>
        </TabsList>

        {/* Advanced Analytics Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Ticket Analytics
              </CardTitle>
              <CardDescription>
                Real-time insights and performance metrics for your helpdesk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedTicketDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Ticket Management */}
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Live Ticket Management
              </CardTitle>
              <CardDescription>
                Real-time ticket monitoring and AI-assisted support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIHelpdeskSystem />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Automation */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Workflow Automation Rules
              </CardTitle>
              <CardDescription>
                Create intelligent automation rules to streamline ticket processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowAutomationManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Policies */}
        <TabsContent value="sla" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SLA Policy Management
              </CardTitle>
              <CardDescription>
                Define service level agreements and response time requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SLAPoliciesManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket Templates
            </CardTitle>
              <CardDescription>
                Pre-configured ticket templates for common support scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTemplatesManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields */}
        <TabsContent value="fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Custom Field Configuration
              </CardTitle>
              <CardDescription>
                Configure custom fields to capture specific ticket information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomFieldsManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Engine */}
        <TabsContent value="engine" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Engine Status
              </CardTitle>
              <CardDescription>
                Monitor and control the automation engine that processes your rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomationEngine />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}