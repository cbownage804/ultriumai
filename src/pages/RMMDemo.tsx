import { RMMTicketingDemo } from "@/components/rmm/RMMTicketingDemo";

export default function RMMDemo() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">RMM & Ticketing Integration</h1>
        <p className="text-muted-foreground">
          Fully integrated customer management, device monitoring, and support ticketing
        </p>
      </div>
      <RMMTicketingDemo />
    </div>
  );
}