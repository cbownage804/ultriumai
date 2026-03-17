import { cn } from '@/lib/utils';
import { Monitor, Tablet, Smartphone, Laptop } from 'lucide-react';

export type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'mobile-landscape';

interface DeviceConfig {
  id: DeviceType;
  label: string;
  icon: typeof Monitor;
  width: number;
  height: number;
  /** CSS for the device bezel/frame */
  frameClass: string;
  /** Inner screen border radius */
  screenRadius: string;
  /** Show notch/dynamic island */
  hasNotch: boolean;
}

const DEVICES: DeviceConfig[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    icon: Monitor,
    width: 0, // Full width
    height: 0,
    frameClass: '',
    screenRadius: '0',
    hasNotch: false,
  },
  {
    id: 'laptop',
    label: 'Laptop (1280px)',
    icon: Laptop,
    width: 1280,
    height: 800,
    frameClass: 'rounded-xl border-[3px] border-[#2a2a3a] shadow-2xl',
    screenRadius: '8px',
    hasNotch: false,
  },
  {
    id: 'tablet',
    label: 'iPad (768px)',
    icon: Tablet,
    width: 768,
    height: 1024,
    frameClass: 'rounded-[24px] border-[6px] border-[#1c1c2e] shadow-2xl',
    screenRadius: '18px',
    hasNotch: false,
  },
  {
    id: 'mobile',
    label: 'iPhone (390px)',
    icon: Smartphone,
    width: 390,
    height: 844,
    frameClass: 'rounded-[36px] border-[5px] border-[#1c1c2e] shadow-2xl',
    screenRadius: '30px',
    hasNotch: true,
  },
  {
    id: 'mobile-landscape',
    label: 'Mobile Landscape',
    icon: Smartphone,
    width: 844,
    height: 390,
    frameClass: 'rounded-[36px] border-[5px] border-[#1c1c2e] shadow-2xl',
    screenRadius: '30px',
    hasNotch: false,
  },
];

interface DeviceFramePreviewProps {
  device: DeviceType;
  children: React.ReactNode;
  className?: string;
}

export function DeviceFramePreview({ device, children, className }: DeviceFramePreviewProps) {
  const config = DEVICES.find(d => d.id === device) || DEVICES[0];

  // Desktop = no frame
  if (device === 'desktop') {
    return <div className={cn("w-full h-full", className)}>{children}</div>;
  }

  return (
    <div className={cn("flex items-center justify-center w-full h-full p-4", className)}>
      <div
        className={cn("relative bg-[#0c0c18] flex-shrink-0 overflow-hidden", config.frameClass)}
        style={{
          width: config.width ? `min(${config.width}px, 100%)` : '100%',
          height: config.height ? `min(${config.height}px, calc(100% - 32px))` : '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Dynamic Island / Notch */}
        {config.hasNotch && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
            <div className="w-[90px] h-[25px] bg-black rounded-full" />
          </div>
        )}

        {/* Screen content */}
        <div
          className="w-full h-full overflow-hidden"
          style={{ borderRadius: config.screenRadius }}
        >
          {children}
        </div>

        {/* Home indicator (mobile) */}
        {(device === 'mobile' || device === 'mobile-landscape') && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10">
            <div className="w-[100px] h-[4px] bg-white/20 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}

interface DeviceSwitcherProps {
  active: DeviceType;
  onChange: (device: DeviceType) => void;
}

export function DeviceSwitcher({ active, onChange }: DeviceSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
      {DEVICES.map((d) => {
        const Icon = d.icon;
        return (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            title={d.label}
            className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center transition-all",
              d.id === 'mobile-landscape' && "rotate-90",
              active === d.id
                ? "bg-white/10 text-white"
                : "text-white/25 hover:text-white/50 hover:bg-white/5"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export function getDeviceViewport(device: DeviceType): { width: number; height: number } {
  const config = DEVICES.find(d => d.id === device) || DEVICES[0];
  return { width: config.width, height: config.height };
}

export { DEVICES };
