import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminAnalisesLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-64 mb-1.5" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16 hidden lg:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
