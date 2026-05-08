import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";

export default function PlannedLoading() {
    return <TableSkeleton columns={invoiceSkeletonColumns} rows={5} />;
}
