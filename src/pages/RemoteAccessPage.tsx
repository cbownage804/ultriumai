import { RemoteAccess } from "@/components/rmm/RemoteAccess";

export default function RemoteAccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Remote Access Management
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Securely connect and manage remote devices with real-time desktop access
          </p>
        </div>
        
        <RemoteAccess />
      </div>
    </div>
  );
}