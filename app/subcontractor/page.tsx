import SubcontractorForm from "./components/SubcontractorForm";

export const metadata = {
  title: "Subcontractor Application | Zoho Admin Web",
  description: "Apply to become a subcontractor with our premium security network.",
};

export default function SubcontractorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 overflow-x-hidden w-full max-w-full">
      <div className="w-[94%] max-w-5xl mx-auto sm:w-full sm:px-6">
        <div className="w-full max-w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 md:p-6 overflow-hidden animate-in fade-in duration-700">
          <SubcontractorForm />
        </div>
      </div>
    </div>
  );
}
