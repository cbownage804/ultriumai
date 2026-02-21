/**
 * Skeleton placeholder shown while the first build hasn't produced preview HTML yet.
 * Mimics a typical web app layout with shimmer effects.
 * Uses CSS-only animations to avoid JS animation overhead during generation.
 */
export function SkeletonPreview() {
  const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent before:animate-[shimmer_2s_infinite] before:translate-x-[-100%]";

  return (
    <div className="flex flex-col h-full w-full bg-[#111119] p-6 gap-4 animate-fade-in">
      {/* Fake nav bar */}
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg bg-white/[0.06] ${shimmer}`} />
        <div className={`h-4 w-32 rounded bg-white/[0.06] ${shimmer}`} />
        <div className="flex-1" />
        <div className={`h-4 w-16 rounded bg-white/[0.06] ${shimmer}`} />
        <div className={`h-4 w-16 rounded bg-white/[0.06] ${shimmer}`} />
        <div className={`h-8 w-20 rounded-lg bg-white/[0.06] ${shimmer}`} />
      </div>

      {/* Hero section */}
      <div className="flex flex-col items-center gap-3 py-10">
        <div className={`h-8 w-64 rounded bg-white/[0.06] ${shimmer}`} />
        <div className={`h-4 w-80 rounded bg-white/[0.04] ${shimmer}`} />
        <div className={`h-10 w-36 rounded-lg bg-white/[0.06] ${shimmer} mt-2`} />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col gap-3 ${shimmer} animate-fade-in`}
            style={{ animationDelay: `${100 * i}ms`, animationFillMode: 'backwards' }}
          >
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
            <div className="flex-1" />
            <div className="h-8 w-full rounded-lg bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
