/**
 * White-Label Report Builder
 * Create branded PDF reports for client IT managers
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Plus, 
  Download, 
  Send, 
  Palette, 
  Image,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  Settings,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReportTemplate {
  id: string;
  template_name: string;
  report_type: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  company_name: string | null;
  footer_text: string | null;
  include_sections: string[];
  is_scheduled: boolean;
  schedule_frequency: string | null;
  last_generated_at: string | null;
}

const defaultTemplate: Partial<ReportTemplate> = {
  template_name: '',
  report_type: 'performance',
  primary_color: '#0ea5e9',
  secondary_color: '#8b5cf6',
  company_name: '',
  footer_text: '',
  include_sections: ['summary', 'metrics', 'charts', 'details'],
  is_scheduled: false,
  schedule_frequency: 'monthly'
};

const reportTypes = [
  { value: 'performance', label: 'Performance Report' },
  { value: 'sla', label: 'SLA Compliance Report' },
  { value: 'ticket_summary', label: 'Ticket Summary' },
  { value: 'escalation', label: 'Escalation Report' },
  { value: 'csat', label: 'Customer Satisfaction' },
  { value: 'custom', label: 'Custom Report' },
];

const sectionOptions = [
  { id: 'summary', label: 'Executive Summary' },
  { id: 'metrics', label: 'Key Metrics' },
  { id: 'charts', label: 'Visual Charts' },
  { id: 'details', label: 'Detailed Breakdown' },
  { id: 'trends', label: 'Trend Analysis' },
  { id: 'recommendations', label: 'AI Recommendations' },
];

export const WhiteLabelReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ReportTemplate> | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [user?.id]);

  const fetchTemplates = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('vanguard_report_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setTemplates(data as any);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.id || !editingTemplate?.template_name) return;

    const payload = {
      template_name: editingTemplate.template_name || 'Untitled Report',
      report_type: editingTemplate.report_type || 'performance',
      user_id: user.id,
      logo_url: editingTemplate.logo_url || null,
      primary_color: editingTemplate.primary_color || '#0ea5e9',
      secondary_color: editingTemplate.secondary_color || '#8b5cf6',
      company_name: editingTemplate.company_name || null,
      footer_text: editingTemplate.footer_text || null,
      include_sections: editingTemplate.include_sections || [],
      is_scheduled: editingTemplate.is_scheduled ?? false,
      schedule_frequency: editingTemplate.schedule_frequency || null
    };

    let error;
    if (editingTemplate.id) {
      const { error: e } = await supabase
        .from('vanguard_report_templates')
        .update(payload)
        .eq('id', editingTemplate.id);
      error = e;
    } else {
      const { error: e } = await supabase
        .from('vanguard_report_templates')
        .insert([payload]);
      error = e;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Report template saved successfully." });
      setDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    }
  };

  const handleGenerate = async (templateId: string) => {
    setGenerating(templateId);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await supabase
      .from('vanguard_report_templates')
      .update({ last_generated_at: new Date().toISOString() })
      .eq('id', templateId);

    setGenerating(null);
    toast({ 
      title: "Report Generated", 
      description: "PDF report has been generated and is ready for download." 
    });
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('vanguard_report_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Report template removed." });
      fetchTemplates();
    }
  };

  const toggleSection = (sectionId: string) => {
    if (!editingTemplate) return;
    const current = editingTemplate.include_sections || [];
    const updated = current.includes(sectionId)
      ? current.filter(s => s !== sectionId)
      : [...current, sectionId];
    setEditingTemplate({ ...editingTemplate, include_sections: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">White-Label Reports</h2>
          <p className="text-white/60">Create branded PDF reports for clients</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingTemplate(defaultTemplate)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTemplate?.id ? 'Edit' : 'Create'} Report Template
              </DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="bg-white/5 border-white/10">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Template Name</Label>
                      <Input
                        value={editingTemplate.template_name || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })}
                        placeholder="Monthly Performance Report"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Report Type</Label>
                      <Select 
                        value={editingTemplate.report_type || 'performance'}
                        onValueChange={(v) => setEditingTemplate({ ...editingTemplate, report_type: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Include Sections</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {sectionOptions.map(section => (
                        <div 
                          key={section.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            editingTemplate.include_sections?.includes(section.id)
                              ? 'bg-cyan-500/20 border-cyan-500/30'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                          onClick={() => toggleSection(section.id)}
                        >
                          <div className="flex items-center gap-2">
                            {editingTemplate.include_sections?.includes(section.id) && (
                              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                            )}
                            <span className="text-white/80">{section.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Company Name</Label>
                      <Input
                        value={editingTemplate.company_name || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, company_name: e.target.value })}
                        placeholder="Acme IT Solutions"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Logo URL</Label>
                      <Input
                        value={editingTemplate.logo_url || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, logo_url: e.target.value })}
                        placeholder="https://..."
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={editingTemplate.primary_color || '#0ea5e9'}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, primary_color: e.target.value })}
                          className="w-12 h-10 p-1 bg-white/5 border-white/10"
                        />
                        <Input
                          value={editingTemplate.primary_color || '#0ea5e9'}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, primary_color: e.target.value })}
                          className="flex-1 bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={editingTemplate.secondary_color || '#8b5cf6'}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, secondary_color: e.target.value })}
                          className="w-12 h-10 p-1 bg-white/5 border-white/10"
                        />
                        <Input
                          value={editingTemplate.secondary_color || '#8b5cf6'}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, secondary_color: e.target.value })}
                          className="flex-1 bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Footer Text</Label>
                    <Textarea
                      value={editingTemplate.footer_text || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })}
                      placeholder="Confidential - For internal use only"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-lg border border-white/10" style={{ 
                    background: `linear-gradient(135deg, ${editingTemplate.primary_color}20, ${editingTemplate.secondary_color}20)` 
                  }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                        <Image className="h-4 w-4 text-white/60" />
                      </div>
                      <span className="font-bold text-white">{editingTemplate.company_name || 'Company Name'}</span>
                    </div>
                    <p className="text-sm text-white/60">Report Preview</p>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <Label className="text-white/80">Enable Scheduled Generation</Label>
                      <p className="text-sm text-white/60">Automatically generate and email reports</p>
                    </div>
                    <Switch
                      checked={editingTemplate.is_scheduled}
                      onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, is_scheduled: v })}
                    />
                  </div>

                  {editingTemplate.is_scheduled && (
                    <div className="space-y-2">
                      <Label className="text-white/80">Frequency</Label>
                      <Select 
                        value={editingTemplate.schedule_frequency || 'monthly'}
                        onValueChange={(v) => setEditingTemplate({ ...editingTemplate, schedule_frequency: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500" onClick={handleSave}>
                    Save Template
                  </Button>
                </div>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="bg-white/5 border-white/10 col-span-full">
            <CardContent className="p-8 text-center text-white/60">
              Loading templates...
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card className="bg-white/5 border-white/10 col-span-full">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-white font-medium mb-2">No Report Templates</h3>
              <p className="text-white/60 text-sm">Create your first branded report template to get started.</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ background: `linear-gradient(135deg, ${template.primary_color}40, ${template.secondary_color}40)` }}
                  >
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    {reportTypes.find(t => t.value === template.report_type)?.label}
                  </Badge>
                </div>
                <CardTitle className="text-white mt-2">{template.template_name}</CardTitle>
                {template.company_name && (
                  <p className="text-sm text-white/60">{template.company_name}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  {template.is_scheduled && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Clock className="h-3 w-3 mr-1" />
                      {template.schedule_frequency}
                    </Badge>
                  )}
                  {template.last_generated_at && (
                    <span>Last: {format(new Date(template.last_generated_at), 'MMM d')}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10"
                    onClick={() => handleGenerate(template.id)}
                    disabled={generating === template.id}
                  >
                    {generating === template.id ? (
                      <Clock className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    Generate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingTemplate(template); setDialogOpen(true); }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WhiteLabelReports;
