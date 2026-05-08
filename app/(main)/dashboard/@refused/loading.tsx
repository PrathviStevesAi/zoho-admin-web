import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";

export default function RefusedLoading() {
    return <TableSkeleton columns={invoiceSkeletonColumns} rows={5} />;
}
