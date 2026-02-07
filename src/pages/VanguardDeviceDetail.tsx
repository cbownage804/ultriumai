import { useEffect } from 'react';
import { VanguardDeviceDetails } from '@/components/vanguard/VanguardDeviceDetails';

export default function VanguardDeviceDetail() {
  useEffect(() => {
    document.title = 'Device Details | Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <VanguardDeviceDetails />
    </div>
  );
}
