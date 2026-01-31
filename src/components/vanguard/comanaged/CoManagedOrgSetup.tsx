import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Palette, 
  Mail, 
  Users, 
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";

interface CoManagedOrgSetupProps {
  onClose: () => void;
  onSave: (org: any) => void;
}

export function CoManagedOrgSetup({ onClose, onSave }: CoManagedOrgSetupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    organization_name: "",
    internal_it_name: "",
    primary_contact_name: "",
    primary_contact_email: "",
    
    // Step 2: Branding
    primary_color: "#0066cc",
    secondary_color: "#004499",
    logo_url: "",
    portal_title: "",
    portal_welcome_message: "",
    
    // Step 3: Email Masking
    support_email_display: "",
    email_from_name: "",
    support_phone_display: "",
    support_hours_display: "Monday - Friday, 9am - 5pm",
    
    // Step 4: Options
    enable_self_service_portal: true,
    enable_live_chat: false,
    enable_knowledge_base: true,
    allow_file_attachments: true,
    require_approval_for_escalation: false
  });

  const steps = [
    { id: 1, title: "Organization", icon: Building2 },
    { id: 2, title: "Branding", icon: Palette },
    { id: 3, title: "Email Masking", icon: Mail },
    { id: 4, title: "Options", icon: Users }
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!formData.organization_name || !formData.internal_it_name) {
        toast.error("Please fill in required fields");
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = () => {
    const newOrg = {
      id: Date.now().toString(),
      organization_name: formData.organization_name,
      internal_it_name: formData.internal_it_name,
      is_active: true,
      stats: { total_users: 0, active_tickets: 0, avg_resolution_hours: 0 },
      branding: { primary_color: formData.primary_color }
    };
    onSave(newOrg);
    toast.success("Co-managed client created successfully!");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black/95 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Add Co-Managed Client
          </DialogTitle>
          <DialogDescription>
            Set up a white-labeled support experience for your client's users
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                step === s.id 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : step > s.id 
                    ? 'text-green-400' 
                    : 'text-white/40'
              }`}>
                {step > s.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-white/20 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm">
                <p className="text-cyan-400 font-medium mb-1">💡 How it works</p>
                <p className="text-white/70">
                  Your client's users will only see the "Internal IT Name" you specify. 
                  They won't know they're using your MSP's ticketing system.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Organization Name *</Label>
                  <Input
                    value={formData.organization_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="Acme Corporation"
                  />
                  <p className="text-xs text-white/40">Your internal reference name</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 flex items-center gap-2">
                    <EyeOff className="h-3 w-3" />
                    Internal IT Name *
                  </Label>
                  <Input
                    value={formData.internal_it_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, internal_it_name: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="Acme IT Department"
                  />
                  <p className="text-xs text-white/40">What end-users will see</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Primary Contact Name</Label>
                  <Input
                    value={formData.primary_contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Primary Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="john@acmecorp.com"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Logo</Label>
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-cyan-500/30 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-cyan-500/10 transition-colors">
                    <Upload className="h-8 w-8 text-white/40" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="h-10 w-16 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="bg-black/40 border-cyan-500/30 text-white w-32"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="h-10 w-16 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="bg-black/40 border-cyan-500/30 text-white w-32"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Portal Title</Label>
                <Input
                  value={formData.portal_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, portal_title: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                  placeholder={`${formData.organization_name || 'Company'} IT Support Portal`}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Welcome Message</Label>
                <Textarea
                  value={formData.portal_welcome_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, portal_welcome_message: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                  placeholder="Welcome to your IT Support Portal. How can we help you today?"
                  rows={3}
                />
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-2">Portal Preview</p>
                <div 
                  className="rounded-lg p-4 text-center"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <p className="text-white font-bold">
                    {formData.portal_title || `${formData.organization_name || 'Company'} IT Support Portal`}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    {formData.portal_welcome_message || 'Welcome to your IT Support Portal'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
                <p className="text-purple-400 font-medium mb-1">🔒 Complete Email Masking</p>
                <p className="text-white/70">
                  All emails will appear to come from your client's domain. 
                  End-users will never see your MSP email addresses.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Display Email Address</Label>
                  <Input
                    value={formData.support_email_display}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_email_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="it@acmecorp.com"
                  />
                  <p className="text-xs text-white/40">What users see in "From" field</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">From Name</Label>
                  <Input
                    value={formData.email_from_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_from_name: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder={formData.internal_it_name || "Acme IT Department"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Support Phone (Display)</Label>
                  <Input
                    value={formData.support_phone_display}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_phone_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Support Hours (Display)</Label>
                  <Input
                    value={formData.support_hours_display}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_hours_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="Monday - Friday, 9am - 5pm"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-2">Email Preview</p>
                <div className="bg-white rounded-lg p-3 text-black text-sm">
                  <p className="font-medium">From: {formData.email_from_name || formData.internal_it_name || 'IT Department'} &lt;{formData.support_email_display || 'it@company.com'}&gt;</p>
                  <p className="text-gray-600 text-xs mt-1">To: user@{formData.organization_name?.toLowerCase().replace(/\s/g, '') || 'company'}.com</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div>
                    <p className="text-white font-medium">Self-Service Portal</p>
                    <p className="text-xs text-white/40">Allow users to submit and track tickets online</p>
                  </div>
                  <Switch
                    checked={formData.enable_self_service_portal}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_self_service_portal: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div>
                    <p className="text-white font-medium">Live Chat Widget</p>
                    <p className="text-xs text-white/40">Enable real-time chat support on portal</p>
                  </div>
                  <Switch
                    checked={formData.enable_live_chat}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_live_chat: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div>
                    <p className="text-white font-medium">Knowledge Base</p>
                    <p className="text-xs text-white/40">Show self-help articles to users</p>
                  </div>
                  <Switch
                    checked={formData.enable_knowledge_base}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_knowledge_base: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div>
                    <p className="text-white font-medium">File Attachments</p>
                    <p className="text-xs text-white/40">Allow users to attach files to tickets</p>
                  </div>
                  <Switch
                    checked={formData.allow_file_attachments}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_file_attachments: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div>
                    <p className="text-white font-medium">Escalation Approval</p>
                    <p className="text-xs text-white/40">Require internal IT approval before MSP escalation</p>
                  </div>
                  <Switch
                    checked={formData.require_approval_for_escalation}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_approval_for_escalation: checked }))}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 font-medium mb-2">✓ Ready to Create</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-white/60">Organization: <span className="text-white">{formData.organization_name}</span></p>
                  <p className="text-white/60">Branded as: <span className="text-white">{formData.internal_it_name}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
          <Button
            variant="ghost"
            onClick={step === 1 ? onClose : handleBack}
            className="text-white/60 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button onClick={handleNext} className="bg-cyan-600 hover:bg-cyan-700">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Check className="h-4 w-4 mr-1" />
                Create Organization
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
