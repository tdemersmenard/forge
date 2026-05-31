import { SkeletonBox } from "../Skeleton";

export default function LeadsLoading() {
  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <SkeletonBox className="mb-2 h-5 w-24" />
          <SkeletonBox className="h-3 w-56" />
        </div>
        <SkeletonBox className="h-9 w-28 rounded-md" />
      </div>
      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <SkeletonBox className="mb-3 h-3 w-28" />
            <SkeletonBox className="h-7 w-20" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-white/[0.08]">
        <div className="border-b border-white/[0.06] p-4">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={i} className="h-7 w-20 rounded-md" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] px-5 py-3.5">
            <SkeletonBox className="h-7 w-7 rounded-full" />
            <SkeletonBox className="h-3 w-32" />
            <SkeletonBox className="ml-auto h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
