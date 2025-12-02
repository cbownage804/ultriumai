import { VanguardDeviceDetails } from '@/components/vanguard/VanguardDeviceDetails';
import { Helmet } from 'react-helmet-async';

export default function VanguardDeviceDetail() {
  return (
    <>
      <Helmet>
        <title>Device Details | Ultrium Vanguard</title>
        <meta name="description" content="View detailed metrics and control your Vanguard security appliance" />
      </Helmet>
      <div className="container mx-auto p-6">
        <VanguardDeviceDetails />
      </div>
    </>
  );
}
