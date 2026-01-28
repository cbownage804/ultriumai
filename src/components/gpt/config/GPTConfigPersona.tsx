import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, MessageSquare } from "lucide-react";

interface GPTConfigPersonaProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

export function GPTConfigPersona({ formData, onChange, themeColor }: GPTConfigPersonaProps) {
  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            System Prompt
          </CardTitle>
          <CardDescription>
            Define your AI assistant's personality, behavior, and expertise. This is the core instruction that shapes how your agent responds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.system_prompt}
            onChange={(e) => onChange("system_prompt", e.target.value)}
            placeholder="You are a helpful AI assistant that specializes in..."
            rows={8}
            className="bg-muted resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Be specific about the assistant's role, tone, and any constraints.
          </p>
        </CardContent>
      </Card>

      {/* Greeting Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Welcome Message
          </CardTitle>
          <CardDescription>
            The first message users see when they start a conversation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.welcome_message || ""}
            onChange={(e) => onChange("welcome_message", e.target.value)}
            placeholder="Hello! I'm here to help you with..."
            rows={3}
            className="bg-muted resize-none"
          />
        </CardContent>
      </Card>

      {/* Personality Traits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Personality Traits
          </CardTitle>
          <CardDescription>
            Define key characteristics that shape your AI's communication style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Communication Style</Label>
            <Input
              value={formData.communication_style || ""}
              onChange={(e) => onChange("communication_style", e.target.value)}
              placeholder="e.g., Professional, Friendly, Technical"
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Expertise Areas</Label>
            <Input
              value={formData.expertise_areas || ""}
              onChange={(e) => onChange("expertise_areas", e.target.value)}
              placeholder="e.g., IT Support, Customer Service, Data Analysis"
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
