import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";

export default function InprogressLoading() {
    return <TableSkeleton columns={invoiceSkeletonColumns} rows={5} />;
}
