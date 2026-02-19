import React, { Suspense } from 'react';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { Loader2 } from 'lucide-react';

interface SafePanelProps {
  show: boolean;
  name: string;
  children: React.ReactNode;
}

function PanelLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-5 w-5 animate-spin text-white/20" />
    </div>
  );
}

export function SafePanel({ show, name, children }: SafePanelProps) {
  if (!show) return null;
  return (
    <PanelErrorBoundary panelName={name}>
      <Suspense fallback={<PanelLoader />}>
        {children}
      </Suspense>
    </PanelErrorBoundary>
  );
}
