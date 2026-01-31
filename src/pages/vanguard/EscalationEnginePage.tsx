import { EscalationEngine } from '@/components/vanguard/automation';

export default function EscalationEnginePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Escalation Engine</h1>
        <p className="text-muted-foreground">
          Automated escalation rules, triggers, and notifications
        </p>
      </div>
      <EscalationEngine />
    </div>
  );
}
