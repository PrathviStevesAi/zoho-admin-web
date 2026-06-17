import ServiceLogsClient from "@/app/(main)/service-logs/ServiceLogsClient";

export const metadata = {
  title: "Service Status - Admin Portal",
  description: "Real-time health status of our databases, cloud storage, mail queues, and third-party APIs.",
};

export default function ServiceLogsPage() {
  return (
    <div className="p-0 sm:p-2 md:p-2 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <ServiceLogsClient initialData={null} />
    </div>
  );
}
