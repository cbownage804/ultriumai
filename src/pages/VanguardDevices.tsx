import { VanguardDevicesList } from '@/components/vanguard/VanguardDevicesList';
import { Helmet } from 'react-helmet-async';

export default function VanguardDevices() {
  return (
    <>
      <Helmet>
        <title>Vanguard Devices | Ultrium Vanguard</title>
        <meta name="description" content="Monitor and manage your Vanguard security appliances" />
      </Helmet>
      <div className="container mx-auto p-6">
        <VanguardDevicesList />
      </div>
    </>
  );
}
