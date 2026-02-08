import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Compass, Plus, GripVertical, Trash2, CheckCircle2, Circle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

interface OnboardingFlow {
  id: string;
  name: string;
  audience: string;
  steps: OnboardingStep[];
  active: boolean;
  completionRate: number;
}

const OnboardingWizardTab = () => {
  const [flows, setFlows] = useState<OnboardingFlow[]>([
    { id: '1', name: 'New User Onboarding', audience: 'All Users', active: true, completionRate: 72,
      steps: [
        { id: 's1', title: 'Complete Profile', description: 'Fill in your name and avatar', required: true },
        { id: 's2', title: 'Connect First Device', description: 'Install agent on a device', required: false },
        { id: 's3', title: 'Create First Ticket', description: 'Submit a test ticket', required: false },
      ]},
    { id: '2', name: 'MSP Client Setup', audience: 'Clients', active: true, completionRate: 45,
      steps: [
        { id: 's4', title: 'Organization Details', description: 'Enter company information', required: true },
        { id: 's5', title: 'Add Team Members', description: 'Invite users to the org', required: true },
        { id: 's6', title: 'Configure Billing', description: 'Set up payment method', required: true },
        { id: 's7', title: 'Deploy Agents', description: 'Install monitoring agents', required: false },
      ]},
  ]);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  const flow = flows.find(f => f.id === selectedFlow);

  const addStep = () => {
    if (!flow) return;
    const newStep: OnboardingStep = { id: Date.now().toString(), title: 'New Step', description: '', required: false };
    setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, steps: [...f.steps, newStep] } : f));
  };

  const removeStep = (stepId: string) => {
    if (!flow) return;
    setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, steps: f.steps.filter(s => s.id !== stepId) } : f));
  };

  const updateStep = (stepId: string, field: keyof OnboardingStep, value: any) => {
    if (!flow) return;
    setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, steps: f.steps.map(s => s.id === stepId ? { ...s, [field]: value } : s) } : f));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Compass className="h-6 w-6" /> Onboarding Wizard Builder</h2>
        <p className="text-muted-foreground">Create and manage onboarding flows for users and clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Flows</CardTitle>
            <Button size="sm" variant="outline" onClick={() => {
              const nf: OnboardingFlow = { id: Date.now().toString(), name: 'New Flow', audience: 'All Users', steps: [], active: false, completionRate: 0 };
              setFlows(prev => [...prev, nf]); setSelectedFlow(nf.id);
            }}><Plus className="h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {flows.map(f => (
              <button key={f.id} onClick={() => setSelectedFlow(f.id)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedFlow === f.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{f.name}</p>
                  <Badge variant={f.active ? 'default' : 'secondary'} className="text-xs">{f.active ? 'Active' : 'Draft'}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{f.audience}</span>·<span>{f.steps.length} steps</span>·<span>{f.completionRate}% completion</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          {flow ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1 mr-4">
                    <Input value={flow.name} onChange={e => setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, name: e.target.value } : f))} className="text-lg font-semibold" />
                  </div>
                  <Button size="sm" onClick={() => toast.success('Flow saved')} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {flow.steps.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mt-1 shrink-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input value={step.title} onChange={e => updateStep(step.id, 'title', e.target.value)} placeholder="Step title" className="text-sm" />
                      <Input value={step.description} onChange={e => updateStep(step.id, 'description', e.target.value)} placeholder="Description" className="text-sm" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                      <Switch checked={step.required} onCheckedChange={v => updateStep(step.id, 'required', v)} />
                      <span className="text-xs text-muted-foreground">Req</span>
                      <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addStep} className="w-full gap-2"><Plus className="h-4 w-4" /> Add Step</Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-muted-foreground">Select a flow to edit</CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OnboardingWizardTab;
