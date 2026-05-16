import { Skeleton } from "@/components/ui/Skeleton";

export default function HistoricoLoading() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
