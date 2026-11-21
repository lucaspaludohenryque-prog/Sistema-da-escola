export function Skeleton({
  className = "",
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-zinc-200/75 dark:bg-white/[0.07] ${className}`}
    />
  );
}

export function ListRowsSkeleton({
  rows = 5,
}: {
  rows?: number;
}): React.JSX.Element {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-12 rounded-lg" />
            <Skeleton className="h-8 w-12 rounded-lg" />
            <Skeleton className="h-8 w-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}): React.JSX.Element {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-zinc-200/80 pb-3 dark:border-white/[0.08]">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-3">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 w-20" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center justify-between gap-4 py-1.5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <div className="flex gap-3">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <Skeleton key={colIdx} className="h-9 w-20 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsStackSkeleton({
  count = 3,
}: {
  count?: number;
}): React.JSX.Element {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-7 w-56" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-3 w-64" />
          <Skeleton className="mt-6 h-56 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-3 w-64" />
          <Skeleton className="mt-6 h-56 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
