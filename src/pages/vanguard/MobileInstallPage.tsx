import { MobileInstallInstructions } from '@/components/vanguard/MobileAppBanner';

export default function MobileInstallPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Install Vanguard Mobile</h1>
        <p className="text-muted-foreground mt-2">
          Get the full Vanguard experience on your mobile device
        </p>
      </div>
      <MobileInstallInstructions />
    </div>
  );
}
