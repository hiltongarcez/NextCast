import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 flex items-center gap-4">
            <Skeleton className="w-10 h-10 flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-12" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 flex-shrink-0" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
            <Skeleton className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-56 mb-1.5" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-20 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
