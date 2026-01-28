import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Bot,
  Sliders,
  BookOpen,
  Zap,
  BarChart3,
  Users,
  Link2,
  Rocket,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { GPTAnalyticsDashboard } from "./GPTAnalyticsDashboard";
import { GPTTeamSharing } from "./GPTTeamSharing";
import { GPTIntegrations } from "./GPTIntegrations";
import { GPTConfiguration } from "./GPTConfiguration";
import { GPTKnowledgeBase } from "./GPTKnowledgeBase";
import { GPTActionsPanel } from "./GPTActionsPanel";
import { GPTDeployPanel } from "./GPTDeployPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

// Branding tab removed - all branding options now in Configuration > General and Advanced tabs
const tabs = [
  { id: "configuration", label: "Configuration", icon: Sliders, description: "Settings & branding" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, description: "Data sources" },
  { id: "actions", label: "Actions", icon: Zap, description: "Automations" },
  { id: "analytics", label: "Analytics", icon: BarChart3, description: "Performance" },
  { id: "sharing", label: "Team", icon: Users, description: "Collaboration" },
  { id: "integrations", label: "Integrations", icon: Link2, description: "Connect apps" },
  { id: "deploy", label: "Deploy", icon: Rocket, description: "Go live" },
];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "configuration":
        return <GPTConfiguration gptId={gpt.id} gptName={gpt.name} themeColor={themeColor} />;
      case "knowledge":
        return <GPTKnowledgeBase gptId={gpt.id} gptName={gpt.name} themeColor={themeColor} />;
      case "actions":
        return <GPTActionsPanel gptId={gpt.id} gptName={gpt.name} themeColor={themeColor} />;
      case "analytics":
        return <GPTAnalyticsDashboard gptId={gpt.id} gptName={gpt.name} themeColor={themeColor} />;
      case "sharing":
        return <GPTTeamSharing gptId={gpt.id} gptName={gpt.name} themeColor={themeColor} />;
      case "integrations":
        return <GPTIntegrations gptId={gpt.id} gptName={gpt.name} apiEnabled={gpt.api_enabled} embedEnabled={gpt.embed_enabled} themeColor={themeColor} />;
      case "deploy":
        return <GPTDeployPanel gptId={gpt.id} gptName={gpt.name} themeColor={themeColor} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${themeColor} 0%, transparent 50%)` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        
        {/* Decorative elements */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: themeColor }}
        />
        
        <div className="relative z-10 px-6 py-8">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="mb-6 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My GPTs
          </Button>

          {/* GPT Identity */}
          <div className="flex items-start gap-5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl"
                style={{ 
                  backgroundColor: themeColor,
                  boxShadow: `0 20px 40px -10px ${themeColor}50`
                }}
              >
                {gpt.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </motion.div>
            
            <div className="flex-1">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h1 className="text-3xl font-bold tracking-tight mb-1">
                  {gpt.name}
                </h1>
                {gpt.description && (
                  <p className="text-muted-foreground max-w-xl mb-3">
                    {gpt.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Badge 
                    className="px-3 py-1"
                    style={{ 
                      backgroundColor: `${themeColor}20`,
                      color: themeColor,
                      borderColor: `${themeColor}40`
                    }}
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/chat/${gpt.id}`)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Test Chat
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b">
        <div className="px-6">
          <ScrollArea className="w-full">
            <div className="flex gap-1 py-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                      isActive 
                        ? "text-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: `${themeColor}15` }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={cn(
                      "h-4 w-4 relative z-10 transition-colors",
                      isActive && "text-primary"
                    )} 
                    style={isActive ? { color: themeColor } : undefined}
                    />
                    <span className="relative z-10">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
