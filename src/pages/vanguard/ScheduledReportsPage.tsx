import { ScheduledReportsManager } from '@/components/vanguard/automation';

export default function ScheduledReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduled Reports</h1>
        <p className="text-muted-foreground">
          Automated report generation, scheduling, and distribution
        </p>
      </div>
      <ScheduledReportsManager />
    </div>
  );
}
