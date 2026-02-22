/**
 * Premium skeleton placeholder shown while the first build hasn't produced preview HTML yet.
 * Uses a neon cyan/violet background image with shimmer overlays.
 */
import previewBg from '@/assets/preview-bg-neon.jpg';

export function SkeletonPreview() {
  const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent before:animate-[shimmer_2s_infinite] before:translate-x-[-100%]";

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      {/* Neon background image */}
      <img
        src={previewBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        aria-hidden="true"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full p-6 gap-5 animate-fade-in">
        {/* Navigation bar */}
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg bg-white/[0.1] backdrop-blur-sm border border-white/[0.08] ${shimmer}`} />
          <div className={`h-4 w-36 rounded-md bg-white/[0.1] backdrop-blur-sm ${shimmer}`} />
          <div className="flex-1" />
          <div className={`h-4 w-16 rounded-md bg-white/[0.07] ${shimmer}`} />
          <div className={`h-4 w-16 rounded-md bg-white/[0.07] ${shimmer}`} />
          <div className={`h-8 w-24 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/15 border border-cyan-400/20 ${shimmer}`} />
        </div>

        {/* Hero section */}
        <div className="flex flex-col items-center gap-3.5 py-12">
          <div className={`h-9 w-72 rounded-lg bg-white/[0.1] backdrop-blur-sm ${shimmer}`} />
          <div className={`h-4 w-96 rounded-md bg-white/[0.06] ${shimmer}`} />
          <div className={`h-4 w-64 rounded-md bg-white/[0.04] ${shimmer}`} />
          <div className={`h-11 w-40 rounded-xl bg-gradient-to-r from-cyan-500/25 to-violet-500/20 border border-cyan-400/25 shadow-[0_0_20px_rgba(6,182,212,0.15)] ${shimmer} mt-3`} />
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-5 flex flex-col gap-3.5 ${shimmer} animate-fade-in`}
              style={{ animationDelay: `${150 * i}ms`, animationFillMode: 'backwards' }}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/10 border border-white/[0.08]" />
              <div className="h-4 w-28 rounded-md bg-white/[0.09]" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-full rounded bg-white/[0.05]" />
                <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
                <div className="h-3 w-3/5 rounded bg-white/[0.03]" />
              </div>
              <div className="h-9 w-full rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>

      {/* Top shimmer accent line — cyan to violet */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
        <div
          className="h-full w-[200%] bg-gradient-to-r from-transparent via-cyan-400/70 to-violet-500/50 opacity-80"
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
