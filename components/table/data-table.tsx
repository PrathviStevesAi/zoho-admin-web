"use client";

import {
    Table, TableHeader, TableBody,
    TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { TableColumn } from "@/types/table.types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type DataTableProps<T> = {
    columns: TableColumn<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
};

export function DataTable<T extends { id?: string | number }>({
    columns,
    data,
    onRowClick,
    emptyMessage = "No data found.",
}: DataTableProps<T>) {
    const router = useRouter();

    const handleRowClick = (row: T) => {
        if (onRowClick) {
            onRowClick(row);
            return;
        }

        if (!row.id) return;

        const rowObj = row as any;
        // Check if it's an invoice row:
        if ('invoice_no' in rowObj && !('shift_no' in rowObj)) {
            router.push(`/invoices/${rowObj.id}`);
        } else {
            // It's a shift row:
            router.push(`/shift/view?shift_id=${rowObj.id}`);
        }
    };

    return (
        <Table className="min-w-[550px]">
            <TableHeader className="bg-surface">
                <TableRow>
                    {columns.filter(col => !col.hidden).map((col) => (
                        <TableHead
                            key={col.key}
                            className={cn(
                                "text-[12px] font-bold uppercase tracking-wider",
                                col.align === "right" && "text-right",
                                col.align === "center" && "text-center"
                            )}
                            style={{ width: col.width }}
                        >
                            {col.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>

            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="py-12 text-center text-muted-foreground text-sm"
                        >
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((row, i) => (
                        <TableRow
                            key={(row as any).id ?? i}
                            onClick={() => handleRowClick(row)}
                            className={cn(
                                "cursor-pointer",
                                "!border-b-0", "!p-10",
                                "hover:bg-slate-50 transition-colors"
                            )}
                        >
                            {columns.filter(col => !col.hidden).map((col) => (
                                <TableCell
                                    key={col.key}
                                    className={cn(
                                        "text-[13px] py-4 px-4 capitalize",
                                        col.align === "right" && "text-right",
                                        col.align === "center" && "text-center"
                                    )}
                                >
                                    {col.render
                                        ? col.render(row)
                                        : String((row as any)[col.key] ?? "")}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
