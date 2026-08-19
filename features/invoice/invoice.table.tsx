import { TableColumn } from "@/types/table.types";
import { InvoiceData } from "@/types/dashboard.types";
import { getStatusBadgeClass, formatStatus } from "@/lib/utils";
import Link from "next/link";
import { FormattedDate } from "@/components/ui/formatted-date";

export const invoiceTableColumns: TableColumn<InvoiceData>[] = [
    {
        key: "invoice_no",
        header: "#",
        width: "80px",
        align: "center",
        render: (row) => (
            <Link href={`/invoices/${row.id}`} className="hover:underline">
                <span className="text-[13px] text-foreground font-medium uppercase " >
                    {row.invoice_no}
                </span>
            </Link>
        ),
    },
    {
        key: "customer_name",
        header: "Name",
        align: "center",
        render: (row) => (
            <span className="text-[13px] font-bold text-foreground capitalize" >
                {row.customer_name} {row.invoice_no}
            </span>
        ),
    },
    {
        key: "created_at",
        header: "Date",
        width: "130px",
        align: "center",
        render: (row) => (
            <span className="text-[13px] text-foreground" >
                <FormattedDate date={row.created_at} includeTime={false} />
            </span>
        ),
    },
    {
        key: "status",
        header: "Status",
        width: "100px",
        align: "center",
        render: (row) => (
            <Link href={`/invoices/${row.id}`} className="cursor-pointer">
                <span
                    className={getStatusBadgeClass(row.status)}
                >
                    {formatStatus(row.status)}
                </span>
            </Link>
        ),
    },
];
