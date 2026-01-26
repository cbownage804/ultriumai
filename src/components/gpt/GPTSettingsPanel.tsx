import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  BarChart3,
  Users,
  Link2,
  ArrowLeft,
  Bot
} from "lucide-react";
import { GPTAnalyticsDashboard } from "./GPTAnalyticsDashboard";
import { GPTTeamSharing } from "./GPTTeamSharing";
import { GPTIntegrations } from "./GPTIntegrations";
import { motion } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState("analytics");
  const themeColor = gpt.theme_color || "#3b82f6";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
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
              <p className="text-muted-foreground text-sm">{gpt.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
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
        </TabsList>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
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
        </motion.div>
      </Tabs>
    </div>
  );
}
