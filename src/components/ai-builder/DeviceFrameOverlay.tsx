/**
 * Device Frame Overlay — Phase 32
 * Renders pixel-accurate device frames around the preview iframe.
 */

import { cn } from '@/lib/utils';
import { RotateCw } from 'lucide-react';
import { useState } from 'react';

type DeviceType = 'none' | 'iphone15' | 'ipad' | 'macbook';

interface DeviceFrameOverlayProps {
  device: DeviceType;
  onRotate?: () => void;
  isLandscape?: boolean;
  children: React.ReactNode;
}

const DEVICE_STYLES: Record<DeviceType, { width: number; height: number; borderRadius: number; bezel: number; hasNotch?: boolean }> = {
  none: { width: 0, height: 0, borderRadius: 0, bezel: 0 },
  iphone15: { width: 393, height: 852, borderRadius: 47, bezel: 12, hasNotch: true },
  ipad: { width: 820, height: 1180, borderRadius: 18, bezel: 16 },
  macbook: { width: 1440, height: 900, borderRadius: 10, bezel: 8 },
};

export function DeviceFrameOverlay({ device, onRotate, isLandscape, children }: DeviceFrameOverlayProps) {
  if (device === 'none') return <>{children}</>;

  const spec = DEVICE_STYLES[device];
  const w = isLandscape ? spec.height : spec.width;
  const h = isLandscape ? spec.width : spec.height;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Device frame */}
      <div
        className="relative bg-[#1a1a2e] shadow-2xl"
        style={{
          borderRadius: spec.borderRadius,
          padding: spec.bezel,
          maxWidth: '100%',
        }}
      >
        {/* Notch for iPhone */}
        {spec.hasNotch && !isLandscape && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
            <div
              className="bg-[#1a1a2e] rounded-b-2xl"
              style={{ width: 126, height: 34 }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0d0d1a] border border-white/[0.06]" />
            </div>
          </div>
        )}

        {/* Screen area */}
        <div
          className="overflow-hidden bg-white relative"
          style={{ borderRadius: Math.max(0, spec.borderRadius - spec.bezel) }}
        >
          {children}
        </div>

        {/* Home indicator for iPhone/iPad */}
        {(device === 'iphone15' || device === 'ipad') && !isLandscape && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
            <div className="w-[134px] h-[5px] rounded-full bg-white/20" />
          </div>
        )}
      </div>

      {/* Rotate button */}
      {device !== 'macbook' && onRotate && (
        <button
          onClick={onRotate}
          className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          <RotateCw className="h-3 w-3" />
          <span>{isLandscape ? 'Portrait' : 'Landscape'}</span>
        </button>
      )}

      {/* Dimension badge */}
      <span className="text-[9px] text-white/15 font-mono">
        {w} × {h}
      </span>
    </div>
  );
}

export { type DeviceType };
