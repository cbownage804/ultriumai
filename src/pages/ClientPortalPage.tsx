import ClientPortal from "@/components/client-portal/ClientPortal";

export default function ClientPortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6">
        <ClientPortal />
      </div>
    </div>
  );
}