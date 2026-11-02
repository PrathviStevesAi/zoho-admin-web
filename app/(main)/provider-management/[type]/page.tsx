import { notFound } from "next/navigation";
import { ProviderDirectoryTable } from "../_components/ProviderDirectoryTable";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function ProviderTypePage({ params }: PageProps) {
  const resolvedParams = await params;
  const type = resolvedParams.type?.toLowerCase();

  if (type !== "fastguard" && type !== "agency" && type !== "agent") {
    notFound();
  }

  return <ProviderDirectoryTable type={type} />;
}
