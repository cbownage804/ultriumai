import { useEffect } from 'react';
import { MSPBillingDashboard } from '@/components/vanguard/billing';

export default function VanguardMSPBilling() {
  useEffect(() => {
    document.title = 'MSP Billing | Ultrium Vanguard';
  }, []);

  return <MSPBillingDashboard />;
}
