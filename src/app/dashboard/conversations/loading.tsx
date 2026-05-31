import { SkeletonBox } from "../Skeleton";

export default function ConversationsLoading() {
  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      <div className="mb-6">
        <SkeletonBox className="mb-2 h-5 w-40" />
        <SkeletonBox className="h-3 w-56" />
      </div>
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-white/[0.08]">
        {/* Thread list skeleton */}
        <div className="w-80 shrink-0 border-r border-white/[0.06] p-4">
          <SkeletonBox className="mb-4 h-8 w-full rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-3 flex gap-3">
              <SkeletonBox className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1">
                <SkeletonBox className="mb-1.5 h-3 w-3/4" />
                <SkeletonBox className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        {/* Chat area skeleton */}
        <div className="flex-1 p-6">
          <div className="flex h-full items-center justify-center">
            <SkeletonBox className="h-4 w-48" />
          </div>
        </div>
      </div>
    </main>
  );
}
