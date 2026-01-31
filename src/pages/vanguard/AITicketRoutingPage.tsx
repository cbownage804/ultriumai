import { AITicketRouter } from '@/components/vanguard/automation';

export default function AITicketRoutingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Ticket Routing</h1>
        <p className="text-muted-foreground">
          Intelligent ticket assignment based on skills, workload, and availability
        </p>
      </div>
      <AITicketRouter />
    </div>
  );
}
