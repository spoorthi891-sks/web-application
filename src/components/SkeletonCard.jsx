export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/5" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/10" />
      <div className="mt-2 h-3 w-1/3 rounded bg-white/5" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/5" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="h-3 w-24 rounded bg-white/5" />
        <div className="h-3 w-12 rounded bg-white/5" />
      </div>
    </div>
  );
}
