import { useState } from 'react';
import { Smartphone, Download, Check, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface PWAGeneratorProps {
  projectName: string;
  primaryColor?: string;
  onInjectFiles: (files: ProjectFile[]) => void;
  onDismiss?: () => void;
}

/** Generate manifest.json content */
function generateManifest(name: string, primaryColor: string): string {
  return JSON.stringify({
    name,
    short_name: name.slice(0, 12),
    description: `${name} — Progressive Web App`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: primaryColor,
    orientation: 'any',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2);
}

/** Generate a basic service worker with cache-first strategy */
function generateServiceWorker(cacheName: string): string {
  return `// Service Worker — Cache-first with network fallback
const CACHE_NAME = '${cacheName}-v1';
const PRECACHE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => caches.match('/'))
  );
});
`;
}

/** Generate an install prompt component */
function generateInstallPrompt(): string {
  return `import { useState, useEffect } from 'react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  return (
    <div style={{
      position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 9999, maxWidth: '90vw',
    }}>
      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Install this app?</span>
      <button onClick={handleInstall} style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
        border: 'none', borderRadius: '8px', padding: '6px 16px', fontSize: '13px',
        cursor: 'pointer', fontWeight: 600,
      }}>Install</button>
      <button onClick={() => setShowPrompt(false)} style={{
        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)',
        cursor: 'pointer', fontSize: '16px',
      }}>✕</button>
    </div>
  );
}
`;
}

export function PWAGenerator({ projectName, primaryColor = '#6366f1', onInjectFiles, onDismiss }: PWAGeneratorProps) {
  const [injected, setInjected] = useState(false);

  const handleInject = () => {
    const cacheName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const files: ProjectFile[] = [
      { path: 'manifest.json', content: generateManifest(projectName, primaryColor), language: 'json' },
      { path: 'service-worker.js', content: generateServiceWorker(cacheName), language: 'javascript' },
      { path: 'PWAInstallPrompt.tsx', content: generateInstallPrompt(), language: 'typescriptreact' },
    ];
    onInjectFiles(files);
    setInjected(true);
  };

  return (
    <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300">PWA Configuration</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <Download className="h-3 w-3 text-white/25" />
          <span>manifest.json — App icon, name, theme</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <WifiOff className="h-3 w-3 text-white/25" />
          <span>service-worker.js — Offline caching</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <Smartphone className="h-3 w-3 text-white/25" />
          <span>PWAInstallPrompt.tsx — Install banner</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/[0.04]">
        <button
          onClick={handleInject}
          disabled={injected}
          className={cn(
            "flex-1 h-7 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
            injected
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/20"
          )}
        >
          {injected ? <><Check className="h-3 w-3" /> Files Added</> : 'Add PWA Files'}
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="h-7 px-3 rounded-lg text-[11px] text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
