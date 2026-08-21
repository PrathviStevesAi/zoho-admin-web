import { Skeleton } from "@/components/ui/skeleton";

export function GuardPageSkeleton() {
  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <Skeleton className="h-8 w-44" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
        <div className="px-6 py-5 flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-64" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-52" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 space-y-3">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="w-full aspect-video rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="max-w-2xl mx-auto w-full aspect-video rounded-2xl" />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="w-full h-32 rounded-xl" />
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xs mx-auto">
        <Skeleton className="w-full h-12 rounded-xl" />
        <Skeleton className="w-full h-12 rounded-xl" />
      </div>

      <div className="text-center space-y-2 pt-4 border-t border-slate-100">
        <Skeleton className="h-3.5 w-56 mx-auto" />
        <Skeleton className="h-3.5 w-44 mx-auto" />
      </div>
    </div>
  );
}
