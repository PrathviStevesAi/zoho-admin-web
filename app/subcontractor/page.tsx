import SubcontractorForm from "./components/SubcontractorForm";

export const metadata = {
  title: "Subcontractor Application | Zoho Admin Web",
  description: "Apply to become a subcontractor with our premium security network.",
};

export default function SubcontractorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/20 py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 animate-in fade-in duration-700">
          <div className="mb-8 border-b pb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Subcontractor Application Form</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0">
              Please complete all required fields. Ensure your documents are clear and up to date.
            </p>
          </div>

          <SubcontractorForm />
        </div>
      </div>
    </div>
  );
}
