"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormattedDate } from "@/components/ui/formatted-date";

interface SelectShiftsStepProps {
  step1Shifts: any[];
  selectedShiftIds: string[];
  isStep1ShiftsLoading: boolean;
  onSelectShift: (id: string, checked: boolean) => void;
  onSelectAllShifts: (checked: boolean) => void;
  onCancel: () => void;
  onProceedToStep2: () => void;
}

export function SelectShiftsStep({
  step1Shifts,
  selectedShiftIds,
  isStep1ShiftsLoading,
  onSelectShift,
  onSelectAllShifts,
  onCancel,
  onProceedToStep2,
}: SelectShiftsStepProps) {
  return (
    <div>
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">
            Select Shifts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            You can select multiple shifts
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onCancel}
          className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto text-center shrink-0"
        >
          Cancel
        </Button>
      </div>

      <div className="p-0">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <Table className="min-w-[650px] md:min-w-full">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[60px] py-2.5 px-4 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                    checked={step1Shifts.length > 0 && selectedShiftIds.length === step1Shifts.length}
                    onChange={(e) => onSelectAllShifts(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Shift No.</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Service Name</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Start Time</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">End Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isStep1ShiftsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0064cb]" />
                      <span>Loading shifts...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : step1Shifts.length > 0 ? (
                step1Shifts.map((shift: any, idx: number) => {
                  const shiftKeyId = String(shift.shift_id || shift.id);
                  return (
                    <TableRow key={`step1-shift-${shiftKeyId || idx}-${idx}`} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <TableCell className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                          checked={selectedShiftIds.includes(shiftKeyId)}
                          onChange={(e) => onSelectShift(shiftKeyId, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-700 py-2.5 px-4">
                        <Link
                          href={`/shift/view?shift_id=${shiftKeyId}`}
                          className="text-[#0064cb] hover:text-[#0052ae] hover:underline cursor-pointer transition-all"
                        >
                          {shift.shift_no}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-800 py-2.5 px-4">{shift.service_name}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-800 py-2.5 px-4">
                        <FormattedDate date={shift.start_time} timezone={shift.timezone || 'UTC'} />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-800 py-2.5 px-4">
                        <FormattedDate date={shift.end_time} timezone={shift.timezone || 'UTC'} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-700 font-medium">
                    No shifts found for this invoice. Please schedule shifts first.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 w-full">
          <Button
            onClick={onProceedToStep2}
            className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-11 rounded-lg font-bold shadow-lg shadow-[#0064cb]/20 transition-all cursor-pointer w-full sm:w-auto flex justify-center items-center"
          >
            Go to Step 2
          </Button>
        </div>
      </div>
    </div>
  );
}
