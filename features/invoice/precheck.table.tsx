import { TableColumn } from "@/types/table.types";
import { Record } from "@/types/dashboard.types";
import { getStatusBadgeClass, formatStatus } from "@/lib/utils";
import Link from "next/link";

export const precheckTableColumns: TableColumn<Record>[] = [
    {
        key: "shift_no",
        header: "Shift No",
        width: "100px",
        align: "center",
        render: (row) => (
            <span className="text-[13px] text-foreground font-medium uppercase " >
                {row.shift_no}
            </span>
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
        key: "start_time",
        header: "Date",
        width: "130px",
        align: "center",
        render: (row) => (
            <span className="text-[13px] text-foreground" >
                {
                    new Date(row.start_time).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                    })
                }
            </span>
        ),
    },
    {
        key: "status",
        header: "Status",
        width: "100px",
        align: "center",
        render: (row) => (
            <Link href={`/shift/view?shift_id=${row.id}`} className="cursor-pointer">
                <span className={getStatusBadgeClass(row.status)}>
                    {formatStatus(row.status)}
                </span>
            </Link>
        ),
    },
    {
        key: "service_address",
        header: "Service Address",
        width: "250px",
        render: (row) => (
            <span className="text-[13px] text-foreground block truncate max-w-[250px]" title={row.service_address || ""}>
                {row.service_address || "—"}
            </span>
        ),
    },
];
