"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Skeleton } from "@/components/ui/skeleton";

interface GuardsTableProps {
  guards: any[];
  currentPage: number;
  pageSize: number;
  onView?: (guard: any) => void;
  loading: boolean;
}

export function GuardsTable({ guards, currentPage, pageSize, onView, loading }: GuardsTableProps) {
  return (
    <div className="mt-4 pt-4">
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-y border-x border-slate-200 bg-slate-100/60">
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">No.</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Full Name</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">City</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">State</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Country</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Submit on</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b [&_tr:last-child]:border-x [&_tr:last-child]:border-slate-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-x border-slate-200">
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-6" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-8 w-14 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : guards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500 font-medium">No more data</TableCell>
              </TableRow>
            ) : (
              guards.map((guard, idx) => (
                <TableRow key={guard.id} className="hover:bg-slate-50/50 border-b border-x border-slate-200 transition-colors">
                  <TableCell className="px-4 py-4 text-sm font-medium text-slate-700">{idx + 1 + (currentPage - 1) * pageSize}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{`${guard.first_name || ""} ${guard.last_name || ""}`.trim()}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-medium text-slate-700">{guard.phone_number}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-medium text-slate-700">{guard.city}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-medium text-slate-700">{guard.state}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-medium text-slate-700">{guard.country}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-medium text-slate-700">{guard.created_at ? <FormattedDate date={guard.created_at} includeTime={false} /> : ""}</TableCell>
                  <TableCell className="px-4 py-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onView?.(guard)}
                      className="h-8 px-3 text-[#0064cb] border-[#0064cb] hover:bg-[#0064cb]/10 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
