import TicketManagement from "@/components/tickets/TicketManagement";

export default function TicketManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6">
        <TicketManagement />
      </div>
    </div>
  );
}