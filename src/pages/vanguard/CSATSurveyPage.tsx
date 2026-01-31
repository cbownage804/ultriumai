import { CSATSurveySystem } from '@/components/vanguard/automation';

export default function CSATSurveyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Satisfaction (CSAT)</h1>
        <p className="text-muted-foreground">
          Survey management, feedback collection, and AI-powered insights
        </p>
      </div>
      <CSATSurveySystem />
    </div>
  );
}
