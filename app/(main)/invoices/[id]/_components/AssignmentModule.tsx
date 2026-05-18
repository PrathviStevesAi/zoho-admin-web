"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AssignmentModuleProps {
  shifts: any[];
  isLoading: boolean;
  onDeleteShift: (id: string) => void;
  onUnassignGuard: (shiftOfferId: string) => void;
  onOpenSelectUser: (selectedIds: string[]) => void;
  onBack: () => void;
  pendingAssignments: Record<string, { guard_id: string, guard_name: string }>;
  onAdd: () => void;
  isAssigning: boolean;
  onRemovePendingAssignment?: (shiftId: string) => void;
}

export function AssignmentModule({
  shifts,
  isLoading,
  onDeleteShift,
  onUnassignGuard,
  onOpenSelectUser,
  onBack,
  pendingAssignments,
  onAdd,
  isAssigning,
  onRemovePendingAssignment
}: AssignmentModuleProps) {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  
  useEffect(() => {
    setSelectedShifts(prev => prev.filter(id => !pendingAssignments[id]));
  }, [pendingAssignments]);

  const selectableShifts = shifts.filter(s => !s.guard && !pendingAssignments[s.shift_id]);
  const isAllSelected = selectableShifts.length > 0 && selectableShifts.every(s => selectedShifts.includes(s.shift_id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShifts(selectableShifts.map(s => s.shift_id));
    } else {
      setSelectedShifts([]);
    }
  };

  const handleSelectRow = (shiftId: string, checked: boolean) => {
    if (checked) {
      setSelectedShifts(prev => [...prev, shiftId]);
    } else {
      setSelectedShifts(prev => prev.filter(id => id !== shiftId));
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 pt-4 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Select guards for shifts</h2>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Rate per hour</Label>
                <div className="relative group">
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg pl-3 pr-14 text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="h-5 w-px bg-slate-200 mr-2" />
                    <span className="text-slate-700 text-[11px] font-bold tracking-wider">USD</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Flat rate</Label>
                <div className="relative group">
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg pl-3 pr-14 text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="h-5 w-px bg-slate-200 mr-2" />
                    <span className="text-slate-700 text-[11px] font-bold tracking-wider">USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Select guards for shifts</h3>
                <Button
                  variant="outline"
                  className={cn(
                    "text-[#0064cb] border-[#0064cb] hover:bg-blue-50 h-9 rounded-lg px-4 font-bold text-xs flex gap-2 transition-all cursor-pointer",
                    selectedShifts.length === 0 && "opacity-50 pointer-events-none grayscale"
                  )}
                  onClick={() => onOpenSelectUser(selectedShifts)}
                  disabled={selectedShifts.length === 0}
                >
                  Select Guard <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[60px] py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          className={cn(
                            "w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer",
                            selectableShifts.length === 0 && "opacity-50 cursor-not-allowed"
                          )}
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={selectableShifts.length === 0}
                        />
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Shift No.</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Service Name</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Start Time</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">End Time</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Guard</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Is Seen</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0064cb]" />
                          <p className="text-xs text-slate-700 mt-2">Loading shifts...</p>
                        </TableCell>
                      </TableRow>
                    ) : shifts.length > 0 ? (
                      shifts.map((shift) => (
                        <TableRow 
                          key={shift.shift_id} 
                          className={cn(
                            "border-slate-50 transition-colors",
                            (shift.guard || pendingAssignments[shift.shift_id]) ? "bg-slate-50/50" : "hover:bg-slate-50/30"
                          )}
                        >
                          <TableCell className="py-4 px-6 text-center">
                            <input
                              type="checkbox"
                              className={cn(
                                "w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer",
                                (shift.guard || pendingAssignments[shift.shift_id]) && "opacity-30 cursor-not-allowed"
                              )}
                              checked={selectedShifts.includes(shift.shift_id) || !!pendingAssignments[shift.shift_id]}
                              onChange={(e) => handleSelectRow(shift.shift_id, e.target.checked)}
                              disabled={!!shift.guard || !!pendingAssignments[shift.shift_id]}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-bold text-slate-700 py-4 px-6">{shift.shift_no}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-4 px-6">{shift.service_name}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-4 px-6">
                            {new Date(shift.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br />
                            <span className="text-[11px] text-slate-700">{new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-4 px-6">
                            {new Date(shift.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br />
                            <span className="text-[11px] text-slate-700">{new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-4 px-6">
                            <div className="flex items-center gap-2">
                              {shift.guard ? (
                                <>
                                  <span className="text-slate-700 font-semibold">
                                    {typeof shift.guard === 'object' ? `${shift.guard.first_name} ${shift.guard.last_name}` : shift.guard}
                                  </span>
                                  <button
                                    onClick={() => onUnassignGuard(shift.shift_offer_id)}
                                    className="w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-sm shadow-red-500/20 ml-auto"
                                    title="Unassign Guard"
                                  >
                                    <X className="w-3 h-3 stroke-[3]" />
                                  </button>
                                </>
                              ) : pendingAssignments[shift.shift_id] ? (
                                <>
                                  <span className="text-[#0064cb] font-semibold text-[13px] animate-pulse">
                                    {pendingAssignments[shift.shift_id].guard_name}
                                  </span>
                                  <button
                                    onClick={() => onRemovePendingAssignment?.(shift.shift_id)}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all cursor-pointer ml-auto"
                                    title="Remove Selection"
                                  >
                                    <X className="w-3 h-3 stroke-[3]" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-300 text-xs">Unassigned</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              shift.is_seen === true ? "bg-green-50 text-green-600" : 
                              shift.is_seen === false ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-700"
                            )}>
                              {shift.is_seen === true ? "Seen" : shift.is_seen === false ? "Not Seen" : "----"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              (shift.status?.toLowerCase().includes("abandon") || 
                               shift.status?.toLowerCase().includes("rejected") || 
                               shift.status?.toLowerCase().includes("refused") ||
                               shift.status?.toLowerCase().includes("cancel"))
                                ? "bg-red-50 text-red-600"
                                : shift.status
                                ? "bg-green-50 text-green-600"
                                : "bg-slate-50 text-slate-700"
                            )}>
                              {shift.status || "----"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-slate-700">No shifts available to assign</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="px-6 h-11 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Back
            </Button>
            <Button
              onClick={onAdd}
              disabled={isAssigning || Object.keys(pendingAssignments).length === 0}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-11 rounded-lg font-bold shadow-lg shadow-[#0064cb]/20 transition-all cursor-pointer min-w-[120px]"
            >
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
