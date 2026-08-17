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
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 overflow-x-hidden w-full max-w-full font-sans">
      <div className="w-[94%] max-w-7xl mx-auto sm:w-full sm:px-6">
        <ReportView data={response.data} />
      </div>
    </div>
  );
}
