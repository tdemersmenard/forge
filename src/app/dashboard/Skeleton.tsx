export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.05] ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <SkeletonBox className="mb-3 h-3 w-28" />
      <SkeletonBox className="h-7 w-20" />
    </div>
  );
}

export function ActivityRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-7 w-7 rounded-full" />
        <div>
          <SkeletonBox className="mb-1.5 h-3 w-28" />
          <SkeletonBox className="h-2.5 w-40" />
        </div>
      </div>
      <SkeletonBox className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="rounded-xl border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-3 w-12" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          <ActivityRowSkeleton />
          <ActivityRowSkeleton />
          <ActivityRowSkeleton />
        </div>
      </div>
    </>
  );
}
