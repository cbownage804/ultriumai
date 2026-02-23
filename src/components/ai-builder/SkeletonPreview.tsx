/**
 * Premium "Getting ready" loading screen shown while the AI generates or compiles.
 * Lovable-inspired with subtle animations, shimmer effects, and rotating tips.
 */
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const TIPS = [
  'You can click any element in the preview to edit it directly.',
  'Use the Code tab to browse and edit files manually.',
  'Your project auto-saves after every generation.',
  'Try "Build" mode for multi-step implementation plans.',
  'You can publish your app with one click when it\'s ready.',
  'Add integrations like Supabase for full-stack features.',
];

export function SkeletonPreview() {
  const [tipIndex, setTipIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % TIPS.length);
        setIsFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#09090b] relative overflow-hidden select-none">
      {/* Ambient background glows — CSS only */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-[15%] right-[20%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.01] blur-[100px]" />
      </div>

      {/* Skeleton wireframe — suggests layout being built */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        {/* Top bar skeleton */}
        <div className="mx-auto mt-6 w-[80%] max-w-[600px] h-3 rounded-full bg-white" />
        {/* Content blocks */}
        <div className="mx-auto mt-10 w-[70%] max-w-[500px] space-y-3">
          <div className="h-8 rounded-lg bg-white w-[60%]" />
          <div className="h-3 rounded bg-white w-full" />
          <div className="h-3 rounded bg-white w-[85%]" />
          <div className="h-3 rounded bg-white w-[70%]" />
        </div>
        <div className="mx-auto mt-8 w-[70%] max-w-[500px] grid grid-cols-2 gap-4">
          <div className="h-24 rounded-xl bg-white" />
          <div className="h-24 rounded-xl bg-white" />
        </div>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-[400px]">
        {/* Animated spinner with glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse scale-150" />
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 skeleton-spin" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="17" stroke="white" strokeOpacity="0.06" strokeWidth="2.5" />
              <path
                d="M37 20a17 17 0 01-17 17"
                stroke="url(#spinner-grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="spinner-grad" x1="37" y1="20" x2="20" y2="37">
                  <stop stopColor="#22d3ee" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <p className="text-[15px] font-medium text-white/70 tracking-tight">
            Building your app…
          </p>
          <p className="text-[12px] text-white/25">
            This usually takes a few seconds
          </p>
        </div>

        {/* Shimmer progress bar */}
        <div className="w-full max-w-[240px]">
          <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-500/50 via-violet-500/60 to-cyan-400/30 skeleton-shimmer" />
          </div>
        </div>

        {/* Rotating tip */}
        <div className="h-10 flex items-center justify-center">
          <p
            className={`text-[11px] text-white/20 text-center leading-relaxed max-w-[280px] transition-opacity duration-400 ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            💡 {TIPS[tipIndex]}
          </p>
        </div>
      </div>

      {/* Top shimmer accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
        <div
          className="h-full w-[200%] bg-gradient-to-r from-transparent via-cyan-400/40 to-violet-500/30 opacity-60"
          style={{ animation: 'shimmer-slide 3s linear infinite' }}
        />
      </div>

      <style>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .skeleton-spin {
          animation: skeleton-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        @keyframes skeleton-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .skeleton-shimmer {
          animation: skeleton-shimmer-move 2s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer-move {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
