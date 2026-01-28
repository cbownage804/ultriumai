import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Trash2, Globe, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GPTConfigConversationProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

const LANGUAGES = [
  { value: "en", label: "English - Worldwide" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

export function GPTConfigConversation({ formData, onChange, themeColor }: GPTConfigConversationProps) {
  const [newQuestion, setNewQuestion] = useState("");
  
  const starterQuestions = formData.starter_questions || [];
  
  const addQuestion = () => {
    if (newQuestion.trim() && starterQuestions.length < 4) {
      onChange("starter_questions", [...starterQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    onChange("starter_questions", starterQuestions.filter((_: string, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Agent Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Agent Language
          </CardTitle>
          <CardDescription>
            Select the primary language your AI assistant will use for responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={formData.language || "en"} 
            onValueChange={(value) => onChange("language", value)}
          >
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Placeholder Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Placeholder Prompt
          </CardTitle>
          <CardDescription>
            The text that appears in the message input field before users start typing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={formData.placeholder_prompt || ""}
            onChange={(e) => onChange("placeholder_prompt", e.target.value)}
            placeholder="Describe your issue and I'll help you troubleshoot..."
            className="bg-muted"
          />
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Loading Indicator
          </CardTitle>
          <CardDescription>
            Choose what users see while your AI is generating a response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.loading_indicator || "dots"} 
            onValueChange={(value) => onChange("loading_indicator", value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dots" id="loading-dots" />
              <Label htmlFor="loading-dots">Typing dots animation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="loading-custom" />
              <Label htmlFor="loading-custom">Custom message</Label>
            </div>
          </RadioGroup>
          {formData.loading_indicator === "custom" && (
            <Input
              value={formData.loading_message || ""}
              onChange={(e) => onChange("loading_message", e.target.value)}
              placeholder="Thinking..."
              className="bg-muted mt-3"
            />
          )}
        </CardContent>
      </Card>

      {/* Starter Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Starter Questions
          </CardTitle>
          <CardDescription>
            Pre-written questions that help users get started with your AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {starterQuestions.map((question: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <Input
                  value={question}
                  onChange={(e) => {
                    const updated = [...starterQuestions];
                    updated[index] = e.target.value;
                    onChange("starter_questions", updated);
                  }}
                  className="bg-muted flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {starterQuestions.length < 4 && (
            <div className="flex gap-2">
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Add a starter question..."
                className="bg-muted"
                onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              />
              <Button variant="outline" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Starter Questions Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Starter Questions Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Starter Questions Header</Label>
            <Input
              value={formData.starter_header || ""}
              onChange={(e) => onChange("starter_header", e.target.value)}
              placeholder="Welcome message that appears above starter questions"
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Starter Questions Expand Text</Label>
            <Input
              value={formData.starter_expand_text || "View More"}
              onChange={(e) => onChange("starter_expand_text", e.target.value)}
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Starter Questions Collapse Text</Label>
            <Input
              value={formData.starter_collapse_text || "View less"}
              onChange={(e) => onChange("starter_collapse_text", e.target.value)}
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Message Ending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Custom Message Ending
          </CardTitle>
          <CardDescription>
            Optional text that gets appended to every AI response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={formData.message_ending || ""}
            onChange={(e) => onChange("message_ending", e.target.value)}
            placeholder="e.g., 'Need more help? Contact support at help@company.com'"
            className="bg-muted"
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Error Message
          </CardTitle>
          <CardDescription>
            Message shown when the AI encounters an error or cannot process a request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={formData.error_message || "I'm sorry, I encountered an error. Please try again."}
            onChange={(e) => onChange("error_message", e.target.value)}
            className="bg-muted"
          />
        </CardContent>
      </Card>

      {/* Conversation Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Conversation Duration
          </CardTitle>
          <CardDescription>
            How long conversations remain active before they timeout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.conversation_duration || "24h"} 
            onValueChange={(value) => onChange("conversation_duration", value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24h" id="duration-24h" />
              <Label htmlFor="duration-24h">Up to 24 hours</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unlimited" id="duration-unlimited" />
              <Label htmlFor="duration-unlimited">Unlimited</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
