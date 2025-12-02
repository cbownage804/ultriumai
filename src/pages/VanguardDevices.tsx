import { useEffect } from 'react';
import { VanguardDevicesList } from '@/components/vanguard/VanguardDevicesList';

export default function VanguardDevices() {
  useEffect(() => {
    document.title = 'Vanguard Devices | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <VanguardDevicesList />
    </div>
  );
}
