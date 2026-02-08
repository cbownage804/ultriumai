import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Mail, FileText, Clock } from 'lucide-react';

const ScheduledReportsTab = () => {
  const reports = [
    { name: 'Daily Admin Digest', frequency: 'Daily @ 8am', status: 'planned', desc: 'New users, ticket volume, error counts, revenue summary' },
    { name: 'Weekly Security Report', frequency: 'Monday @ 9am', status: 'planned', desc: 'Security events, vulnerability scan results, compliance status' },
    { name: 'Monthly Revenue Report', frequency: '1st of month', status: 'planned', desc: 'Subscription revenue, churn, new signups, tier breakdowns' },
    { name: 'SLA Performance Report', frequency: 'Weekly', status: 'planned', desc: 'Ticket response times, SLA breaches, satisfaction scores' },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold flex items-center gap-2"><CalendarClock className="h-6 w-6" /> Scheduled Reports</h2><p className="text-muted-foreground">Automated email digests and report generation</p></div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5" />
          <div><p className="font-medium">Coming Soon</p><p className="text-sm text-muted-foreground">Scheduled report delivery via email is being built. Below are the planned reports that will be available.</p></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(r => (
          <Card key={r.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> {r.name}</CardTitle>
                <Badge variant="secondary">Planned</Badge>
              </div>
              <CardDescription>{r.desc}</CardDescription>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {r.frequency}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScheduledReportsTab;
