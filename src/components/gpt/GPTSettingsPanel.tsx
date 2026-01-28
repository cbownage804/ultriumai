import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Settings,
  BarChart3,
  Users,
  Link2,
  ArrowLeft,
  Bot,
  Sliders,
  BookOpen,
  Zap,
  Palette,
  Rocket,
  MessageSquare
} from "lucide-react";
import { GPTAnalyticsDashboard } from "./GPTAnalyticsDashboard";
import { GPTTeamSharing } from "./GPTTeamSharing";
import { GPTIntegrations } from "./GPTIntegrations";
import { GPTConfiguration } from "./GPTConfiguration";
import { GPTKnowledgeBase } from "./GPTKnowledgeBase";
import { GPTActionsPanel } from "./GPTActionsPanel";
import { GPTWhiteLabelPanel } from "./GPTWhiteLabelPanel";
import { GPTDeployPanel } from "./GPTDeployPanel";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface GPTSettingsPanelProps {
  gpt: {
    id: string;
    name: string;
    description?: string;
    theme_color?: string;
    api_enabled?: boolean;
    embed_enabled?: boolean;
  };
  onBack?: () => void;
}

export function GPTSettingsPanel({ gpt, onBack }: GPTSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState("configuration");
  const themeColor = gpt.theme_color || "#3b82f6";
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard/gpt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My GPTs
        </Button>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: themeColor }}
          >
            {gpt.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {gpt.name}
              <Badge variant="outline">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Badge>
            </h1>
            {gpt.description && (
              <p className="text-muted-foreground text-sm max-w-xl truncate">{gpt.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max gap-1 p-1">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="whitelabel" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              White-Label
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team & Sharing
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="deploy" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Deploy
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          <TabsContent value="configuration" className="m-0">
            <GPTConfiguration
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="m-0">
            <GPTKnowledgeBase
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="actions" className="m-0">
            <GPTActionsPanel
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="whitelabel" className="m-0">
            <GPTWhiteLabelPanel
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="analytics" className="m-0">
            <GPTAnalyticsDashboard 
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="sharing" className="m-0">
            <GPTTeamSharing
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="integrations" className="m-0">
            <GPTIntegrations
              gptId={gpt.id}
              gptName={gpt.name}
              apiEnabled={gpt.api_enabled}
              embedEnabled={gpt.embed_enabled}
              themeColor={themeColor}
            />
          </TabsContent>

          <TabsContent value="deploy" className="m-0">
            <GPTDeployPanel
              gptId={gpt.id}
              gptName={gpt.name}
              themeColor={themeColor}
            />
          </TabsContent>
        </motion.div>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(`/chat/${gpt.id}`)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Test Chat
            </Button>
            <Button variant="outline" onClick={() => navigate(`/dashboard/gpt/build?edit=${gpt.id}`)}>
              <Bot className="h-4 w-4 mr-2" />
              Edit in Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
