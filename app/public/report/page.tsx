import { getPublicShiftReportAction } from "@/actions/public-report.actions";
import ReportView from "@/app/public/report/components/ReportView";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Public Shift Report | Fast Guard Security Service",
};

export default async function PublicReportPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const shift_id = typeof searchParams.shift_id === "string" ? searchParams.shift_id : undefined;
  const report_token = typeof searchParams.report_token === "string" ? searchParams.report_token : undefined;

  if (!shift_id || !report_token) {
    notFound();
  }

  const response = await getPublicShiftReportAction(shift_id, report_token);

  if (!response.success || !response.data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Error Loading Report</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {response.error || "The report could not be found or you do not have permission to view it."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 overflow-x-hidden w-full max-w-full font-sans">
      <div className="w-[94%] max-w-7xl mx-auto sm:w-full sm:px-6">
        <ReportView data={response.data} reportToken={report_token} shiftId={shift_id} />
      </div>
    </div>
  );
}
