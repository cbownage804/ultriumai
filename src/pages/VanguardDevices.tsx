import { useEffect } from 'react';
import { DevicesTabbedView } from '@/components/vanguard/devices';

export default function VanguardDevices() {
  useEffect(() => {
    document.title = 'Vanguard Devices | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <DevicesTabbedView />
    </div>
  );
}
