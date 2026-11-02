import { notFound } from "next/navigation";
import { ProviderDetailView } from "../../_components/ProviderDetailView";

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const type = resolvedParams.type?.toLowerCase();
  const id = resolvedParams.id;

  if (!type || !id || (type !== "agency" && type !== "agent")) {
    notFound();
  }

  return <ProviderDetailView type={type} id={id} />;
}
