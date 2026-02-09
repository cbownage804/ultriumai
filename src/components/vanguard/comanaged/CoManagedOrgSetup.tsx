import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Palette, Mail, Users, ChevronRight, ChevronLeft, Check, Upload, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CoManagedOrgSetupProps {
  onClose: () => void;
  onSave: (org?: any) => void;
}

export function CoManagedOrgSetup({ onClose, onSave }: CoManagedOrgSetupProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: "", internal_it_name: "", primary_contact_name: "", primary_contact_email: "",
    primary_color: "#0066cc", secondary_color: "#004499", logo_url: "", portal_title: "", portal_welcome_message: "",
    support_email_display: "", email_from_name: "", support_phone_display: "", support_hours_display: "Monday - Friday, 9am - 5pm",
    enable_self_service_portal: true, enable_live_chat: false, enable_knowledge_base: true,
    allow_file_attachments: true, require_approval_for_escalation: false,
  });

  const steps = [
    { id: 1, title: "Organization", icon: Building2 },
    { id: 2, title: "Branding", icon: Palette },
    { id: 3, title: "Email Masking", icon: Mail },
    { id: 4, title: "Options", icon: Users },
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.organization_name || !formData.internal_it_name)) {
      toast.error("Please fill in required fields");
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await (supabase as any).from('comanaged_organizations').insert({
        user_id: user.id,
        organization_name: formData.organization_name,
        internal_it_name: formData.internal_it_name,
        primary_contact_name: formData.primary_contact_name,
        primary_contact_email: formData.primary_contact_email,
        primary_color: formData.primary_color,
        is_active: true,
        settings: {
          enable_self_service_portal: formData.enable_self_service_portal,
          enable_live_chat: formData.enable_live_chat,
          enable_knowledge_base: formData.enable_knowledge_base,
          allow_file_attachments: formData.allow_file_attachments,
          require_approval_for_escalation: formData.require_approval_for_escalation,
        },
      }).select().single();

      if (error) throw error;

      // Also create branding record
      if (data?.id) {
        await (supabase as any).from('comanaged_branding').insert({
          organization_id: data.id,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          portal_title: formData.portal_title || `${formData.organization_name} IT Support Portal`,
          portal_welcome_message: formData.portal_welcome_message,
          email_from_name: formData.email_from_name || formData.internal_it_name,
          support_email_display: formData.support_email_display,
          support_phone_display: formData.support_phone_display,
          support_hours_display: formData.support_hours_display,
        });
      }

      toast.success("Co-managed client created successfully!");
      onSave(data);
    } catch (err: any) {
      toast.error("Failed to create organization", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black/95 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Add Co-Managed Client
          </DialogTitle>
          <DialogDescription>Set up a white-labeled support experience for your client's users</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                step === s.id ? 'bg-cyan-500/20 text-cyan-400' : step > s.id ? 'text-green-400' : 'text-white/40'
              }`}>
                {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-white/20 mx-2" />}
            </div>
          ))}
        </div>

        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm">
                <p className="text-cyan-400 font-medium mb-1">💡 How it works</p>
                <p className="text-white/70">Your client's users will only see the "Internal IT Name" you specify.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Organization Name *</Label>
                  <Input value={formData.organization_name} onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="Acme Corporation" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 flex items-center gap-2"><EyeOff className="h-3 w-3" />Internal IT Name *</Label>
                  <Input value={formData.internal_it_name} onChange={(e) => setFormData(prev => ({ ...prev, internal_it_name: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="Acme IT Department" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Primary Contact Name</Label>
                  <Input value={formData.primary_contact_name} onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Primary Contact Email</Label>
                  <Input type="email" value={formData.primary_contact_email} onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="john@acmecorp.com" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="h-10 w-16 rounded cursor-pointer" />
                    <Input value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white w-32" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.secondary_color} onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))} className="h-10 w-16 rounded cursor-pointer" />
                    <Input value={formData.secondary_color} onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white w-32" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Portal Title</Label>
                <Input value={formData.portal_title} onChange={(e) => setFormData(prev => ({ ...prev, portal_title: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder={`${formData.organization_name || 'Company'} IT Support Portal`} />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Welcome Message</Label>
                <Textarea value={formData.portal_welcome_message} onChange={(e) => setFormData(prev => ({ ...prev, portal_welcome_message: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="Welcome to your IT Support Portal. How can we help you today?" rows={3} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
                <p className="text-purple-400 font-medium mb-1">🔒 Complete Email Masking</p>
                <p className="text-white/70">All emails will appear to come from your client's domain.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Display Email Address</Label>
                  <Input value={formData.support_email_display} onChange={(e) => setFormData(prev => ({ ...prev, support_email_display: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="it@acmecorp.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">From Name</Label>
                  <Input value={formData.email_from_name} onChange={(e) => setFormData(prev => ({ ...prev, email_from_name: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder={formData.internal_it_name || "Acme IT Department"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Support Phone</Label>
                  <Input value={formData.support_phone_display} onChange={(e) => setFormData(prev => ({ ...prev, support_phone_display: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Support Hours</Label>
                  <Input value={formData.support_hours_display} onChange={(e) => setFormData(prev => ({ ...prev, support_hours_display: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {[
                { key: 'enable_self_service_portal', label: 'Self-Service Portal', desc: 'Allow users to submit and track tickets online' },
                { key: 'enable_live_chat', label: 'Live Chat Widget', desc: 'Enable real-time chat support on portal' },
                { key: 'enable_knowledge_base', label: 'Knowledge Base', desc: 'Show self-help articles to users' },
                { key: 'allow_file_attachments', label: 'File Attachments', desc: 'Allow users to attach files to tickets' },
                { key: 'require_approval_for_escalation', label: 'Escalation Approval', desc: 'Require internal IT approval before MSP escalation' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-xs text-white/40">{desc}</p>
                  </div>
                  <Switch
                    checked={(formData as any)[key]}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
          <Button variant="outline" onClick={step === 1 ? onClose : handleBack} className="border-cyan-500/30 hover:bg-cyan-500/10">
            {step === 1 ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1" />Back</>}
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} className="bg-cyan-600 hover:bg-cyan-700">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-green-600 to-emerald-600">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {saving ? 'Creating...' : 'Create Organization'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
