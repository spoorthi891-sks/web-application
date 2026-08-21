export default function SkeletonCard() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E141B]/70 p-6">
      <div className="animate-pulse">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-20 rounded-full bg-white/[0.08]" />
          <div className="h-4 w-14 rounded bg-white/[0.05]" />
        </div>
        <div className="h-5 w-3/4 rounded bg-white/[0.08]" />
        <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.04]" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-white/[0.04]" />
          <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
          <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div className="h-3 w-20 rounded bg-white/[0.05]" />
        <div className="h-3 w-12 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}
