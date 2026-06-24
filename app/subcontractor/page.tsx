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
          <SubcontractorForm />
        </div>
      </div>
    </div>
  );
}
