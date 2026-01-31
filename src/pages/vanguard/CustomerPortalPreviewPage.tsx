import { useEffect } from 'react';
import { CustomerSelfServicePortal } from '@/components/vanguard/helpdesk';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function CustomerPortalPreviewPage() {
  useEffect(() => {
    document.title = 'Customer Portal Preview | Vanguard';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ModuleLogo module="response" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            Customer Self-Service Portal
          </h1>
          <p className="text-muted-foreground">Preview of the customer-facing support portal</p>
        </div>
      </div>

      <CustomerSelfServicePortal />
    </div>
  );
}
