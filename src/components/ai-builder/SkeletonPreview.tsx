/**
 * Premium skeleton placeholder shown while the first build hasn't produced preview HTML yet.
 * Mimics a typical web app layout with shimmer effects and ambient glow.
 * Uses CSS-only animations to avoid JS animation overhead during generation.
 */
export function SkeletonPreview() {
  const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent before:animate-[shimmer_2s_infinite] before:translate-x-[-100%]";

  return (
    <div className="flex flex-col h-full w-full bg-[#0c0c14] p-6 gap-5 animate-fade-in relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] rounded-full bg-violet-500/[0.04] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[15%] w-[280px] h-[280px] rounded-full bg-cyan-500/[0.03] blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[50%] left-[50%] w-[200px] h-[200px] rounded-full bg-fuchsia-500/[0.02] blur-[80px] animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full gap-5">
        {/* Navigation bar */}
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg bg-white/[0.07] ${shimmer}`} />
          <div className={`h-4 w-36 rounded-md bg-white/[0.07] ${shimmer}`} />
          <div className="flex-1" />
          <div className={`h-4 w-16 rounded-md bg-white/[0.05] ${shimmer}`} />
          <div className={`h-4 w-16 rounded-md bg-white/[0.05] ${shimmer}`} />
          <div className={`h-8 w-24 rounded-lg bg-gradient-to-r from-violet-500/[0.12] to-cyan-500/[0.08] border border-white/[0.06] ${shimmer}`} />
        </div>

        {/* Hero section */}
        <div className="flex flex-col items-center gap-3.5 py-12">
          <div className={`h-9 w-72 rounded-lg bg-white/[0.07] ${shimmer}`} />
          <div className={`h-4 w-96 rounded-md bg-white/[0.04] ${shimmer}`} />
          <div className={`h-4 w-64 rounded-md bg-white/[0.03] ${shimmer}`} />
          <div className={`h-11 w-40 rounded-xl bg-gradient-to-r from-violet-500/[0.15] to-cyan-500/[0.10] border border-white/[0.08] ${shimmer} mt-3`} />
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 flex flex-col gap-3.5 ${shimmer} animate-fade-in`}
              style={{ animationDelay: `${150 * i}ms`, animationFillMode: 'backwards' }}
            >
              {/* Card icon */}
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06]" />
              {/* Card title */}
              <div className="h-4 w-28 rounded-md bg-white/[0.07]" />
              {/* Card text lines */}
              <div className="space-y-2 flex-1">
                <div className="h-3 w-full rounded bg-white/[0.04]" />
                <div className="h-3 w-4/5 rounded bg-white/[0.03]" />
                <div className="h-3 w-3/5 rounded bg-white/[0.03]" />
              </div>
              {/* Card CTA */}
              <div className="h-9 w-full rounded-xl bg-white/[0.06] border border-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>

      {/* Top shimmer accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          className="h-full w-[200%] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-60"
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
