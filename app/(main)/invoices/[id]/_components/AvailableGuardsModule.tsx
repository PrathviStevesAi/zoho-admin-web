"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AvailableGuardsModuleProps {
  guards: any[];
  isLoading: boolean;
  onBack: () => void;
  totalGuards: number;
}

export function AvailableGuardsModule({
  guards,
  isLoading,
  onBack,
  totalGuards
}: AvailableGuardsModuleProps) {
  const formatArray = (arr: any[] | null) => {
    if (!arr || arr.length === 0) return "----";
    return arr.join(", ");
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 pt-4 pb-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Available Guards</h2>
              <p className="text-sm text-slate-500 mt-0.5">Total available guards found: <span className="font-bold text-slate-900">{totalGuards}</span></p>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Back
            </Button>
          </div>

          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6">Guard Name</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6">Email</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6 text-center">Total Shifts Sent</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6 text-center">Available For Shifts</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6 text-center">Unavailable For Shifts</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6 text-center">Seen</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase py-4 px-6 text-center">Responded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-[#0064cb]" />
                          <p className="text-sm font-medium text-slate-400">Fetching available guards...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : guards.length > 0 ? (
                    guards.map((guard, index) => (
                      <TableRow key={guard.notification_id || index} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="py-4 px-6">
                          <span className="text-sm font-bold text-slate-700">{guard.guard_name}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm font-medium text-slate-500">{guard.email}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            {formatArray(guard.total_shifts_sent)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                            {formatArray(guard.available_for_shifts)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                            {formatArray(guard.unavailable_for_shifts)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            guard.notification_seen ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
                          )}>
                            {guard.notification_seen ? "Seen" : "Unseen"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            guard.is_responded ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                          )}>
                            {guard.is_responded ? "Responded" : "No Response"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-slate-400">No available guards found for this invoice.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
