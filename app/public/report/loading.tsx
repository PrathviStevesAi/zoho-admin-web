import { PublicReportSkeleton } from "@/app/public/report/components/PublicReportSkeleton";

export default function PublicReportLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 overflow-x-hidden w-full max-w-full font-sans">
      <div className="w-[94%] max-w-7xl mx-auto sm:w-full sm:px-6">
        <PublicReportSkeleton />
      </div>
    </div>
  );
}
