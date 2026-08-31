export function PublicReportSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      <div className="w-full flex flex-col items-center justify-center py-6 pb-2 gap-2 mt-4">
        <div className="w-48 h-12 bg-slate-200 dark:bg-slate-800 rounded-md mb-2"></div>

        <div className="w-64 h-10 bg-slate-200 dark:bg-slate-800 rounded-md mt-1"></div>

        <div className="w-24 h-1 bg-slate-200 dark:bg-slate-800 mt-2 mb-2 rounded-full"></div>

        <div className="flex gap-4 mt-2">
          <div className="w-48 h-9 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          <div className="w-40 h-9 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 overflow-hidden">
            <div className="w-full h-[300px] bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </div>

        <div className="lg:col-span-2 h-fit flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                <div className="w-40 h-5 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              </div>
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
