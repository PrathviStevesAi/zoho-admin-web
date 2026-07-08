import QuoteForm from "./components/instant-quote/QuoteForm";

export const metadata = {
  title: "Instant Quote | Fast Guard Security Service",
  description: "Get an instant quote for security guard services.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/20 py-8 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <QuoteForm />
        </div>
      </div>
    </div>
  );
}
