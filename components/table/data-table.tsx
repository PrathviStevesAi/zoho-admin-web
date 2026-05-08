"use client";

import {
    Table, TableHeader, TableBody,
    TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { TableColumn } from "@/types/table.types";
import { cn } from "@/lib/utils";

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
    return (
        <Table>
            <TableHeader className="bg-surface">
                <TableRow>
                    {columns.map((col) => (
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
                            onClick={() => onRowClick?.(row)}
                            className={cn(
                                onRowClick && "cursor-pointer",
                                "!border-b-0", "!p-10"
                            )}
                        >
                            {columns.map((col) => (
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
