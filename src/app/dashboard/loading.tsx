import { OverviewSkeleton } from "./Skeleton";

export default function DashboardLoading() {
  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-5 w-48 animate-pulse rounded-md bg-white/[0.05]" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded-md bg-white/[0.03]" />
      </div>
      <OverviewSkeleton />
    </main>
  );
}
