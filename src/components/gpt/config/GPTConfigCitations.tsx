import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Quote, MessageSquare } from "lucide-react";

interface GPTConfigCitationsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

export function GPTConfigCitations({ formData, onChange, themeColor }: GPTConfigCitationsProps) {
  return (
    <div className="space-y-6">
      {/* I Don't Know Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Quote className="h-5 w-5" />
            I don't know message
          </CardTitle>
          <CardDescription>
            Response when the AI cannot find relevant information to answer a question.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={formData.idk_message || "I couldn't find specific information about that. Please contact support for assistance."}
            onChange={(e) => onChange("idk_message", e.target.value)}
            className="bg-muted"
          />
        </CardContent>
      </Card>

      {/* Show Citations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Quote className="h-5 w-5" />
            Show Citations
          </CardTitle>
          <CardDescription>
            Whether to display source references when the AI provides information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={formData.show_citations || "none"} 
            onValueChange={(value) => onChange("show_citations", value)}
          >
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Don't display citations</SelectItem>
              <SelectItem value="inline">Show inline citations</SelectItem>
              <SelectItem value="footnotes">Show as footnotes</SelectItem>
              <SelectItem value="end">Show at end of response</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Source Names */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Quote className="h-5 w-5" />
            Should the agent mention source names?
          </CardTitle>
          <CardDescription>
            Controls whether the AI can reference specific document or source names in responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.mention_sources || "yes"} 
            onValueChange={(value) => onChange("mention_sources", value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="sources-yes" />
              <Label htmlFor="sources-yes">Yes, agent can include source names in its answers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="sources-no" />
              <Label htmlFor="sources-no">No, agent won't mention source names in its answers, even if asked</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
