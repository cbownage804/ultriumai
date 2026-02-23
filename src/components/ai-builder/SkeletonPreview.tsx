/**
 * "Getting ready" feature carousel shown while the AI generates.
 * Matches Lovable's loading experience with rotating feature cards.
 */
import { useState, useEffect } from 'react';
import { Loader2, Pencil, History, Server, Globe, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: Pencil,
    title: 'Edit visually',
    description: 'Click any element to edit directly, or describe changes in chat.',
    gradient: 'from-rose-500/20 to-orange-500/10',
    iconColor: 'text-rose-400',
  },
  {
    icon: History,
    title: 'Revert and edit messages',
    description: 'Go back to any point in your project history instantly.',
    gradient: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: Server,
    title: 'Full-stack included',
    description: 'Database, hosting, auth, and AI — all built in.',
    gradient: 'from-cyan-500/20 to-blue-500/10',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Globe,
    title: 'Publish your project',
    description: 'Instantly deploy to your own domain with one click.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Measure performance',
    description: 'Track visitors, page views, and trends in real time.',
    gradient: 'from-amber-500/20 to-yellow-500/10',
    iconColor: 'text-amber-400',
  },
];

export function SkeletonPreview() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0a14] relative overflow-hidden select-none">
      {/* Subtle background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      {/* Getting ready spinner */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
          <span className="text-sm font-medium text-white/60">Getting ready...</span>
        </div>

        {/* Feature card carousel */}
        <div className="relative w-[340px] h-[180px]">
          {FEATURES.map((feature, i) => {
            const isActive = i === activeIndex;
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/[0.08] p-6 flex flex-col gap-4 transition-all duration-700 ease-out ${
                  isActive
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }`}
              >
                <div className="h-11 w-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-white/90">{feature.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-cyan-400/70' : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Top shimmer accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
        <div
          className="h-full w-[200%] bg-gradient-to-r from-transparent via-cyan-400/50 to-violet-500/40 opacity-70"
          style={{ animation: 'shimmer-slide 3s linear infinite' }}
        />
      </div>

      <style>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
