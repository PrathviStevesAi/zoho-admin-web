"use client";

import { Calendar, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ShiftModuleProps {
  shifts: any[];
  isLoading: boolean;
  isAdding: boolean;
  onAdd: () => void;
  onCancelAdd: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  services: any[];
  addShiftData: any;
  setAddShiftData: (data: any) => void;
  rowSchedules: any;
  handleRowChange: (date: string, field: string, val: any) => void;
  getDatesList: (start: string, end: string) => Date[];
  onCreateShifts: () => void;
  isCreating: boolean;
  timezone: string;
}

export function ShiftModule({
  shifts,
  isLoading,
  isAdding,
  onAdd,
  onCancelAdd,
  onDelete,
  onBack,
  services,
  addShiftData,
  setAddShiftData,
  rowSchedules,
  handleRowChange,
  getDatesList,
  onCreateShifts,
  isCreating
}: ShiftModuleProps) {
  if (!isAdding) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
          <CardContent className="p-0">
            <div className="px-6 pt-2 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Shift Schedule</h2>
                <p className="text-slate-800 text-sm">View and manage all scheduled shifts for this invoice.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="h-10 px-6 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={onAdd}
                  className="h-10 px-6 rounded-lg font-bold text-white bg-[#0064cb] hover:bg-[#0052ae] shadow-md shadow-[#0064cb]/10 transition-all cursor-pointer flex gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Shift No.</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Service Name</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">Start Time</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6">End Time</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-4 px-6 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5} className="py-4 px-6">
                            <Skeleton className="h-4 w-full rounded" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : shifts.length > 0 ? (
                      shifts.map((shift) => (
                        <TableRow key={shift.shift_id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="text-sm font-bold text-slate-700 py-4 px-6">{shift.shift_no}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-4 px-6">{shift.service_name}</TableCell>
                          <TableCell className="text-sm text-slate-800 py-4 px-6">
                            {DateTime.fromISO(shift.start_time, { setZone: true }).toFormat("MMM d, yyyy, h:mm a")}
                          </TableCell>
                          <TableCell className="text-sm text-slate-800 py-4 px-6">
                            {DateTime.fromISO(shift.end_time, { setZone: true }).toFormat("MMM d, yyyy, h:mm a")}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(shift.shift_id)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-8 h-8 text-slate-200" />
                            <p className="text-sm font-medium text-slate-700">No shift schedule yet</p>
                          </div>
                        </TableCell>
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

  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const now = getLocalTimeString();

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 pt-4 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add New Shift</h2>
              <p className="text-slate-800 text-sm">Create and schedule new shifts for this invoice.</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Select Service</Label>
                <Select
                  value={addShiftData.service}
                  onValueChange={(val) => setAddShiftData((prev: any) => ({ ...prev, service: val }))}
                >
                  <SelectTrigger className="w-full !h-11 bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select the service" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[100]">
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="cursor-pointer">
                        {service.service_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Date from</Label>
                <Input
                  type="date"
                  min={today}
                  className="w-full h-11 bg-white border-slate-200 rounded-lg"
                  value={addShiftData.dateFrom}
                  onChange={(e) => setAddShiftData((prev: any) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase">Date to</Label>
                <Input
                  type="date"
                  min={addShiftData.dateFrom || today}
                  className="w-full h-11 bg-white border-slate-200 rounded-lg"
                  value={addShiftData.dateTo}
                  onChange={(e) => setAddShiftData((prev: any) => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-800 uppercase"># of People</Label>
                <Input
                  type="number"
                  min="0"
                  className="w-full h-11 bg-white border-slate-200 rounded-lg"
                  value={addShiftData.people}
                  onChange={(e) => setAddShiftData((prev: any) => ({ ...prev, people: Math.max(0, Number(e.target.value)) }))}
                />
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-sm font-bold text-slate-900 py-4 px-6 w-[200px]">Date</TableHead>
                    <TableHead className="text-sm font-bold text-slate-900 py-4 px-6">Hours per Day</TableHead>
                    <TableHead className="text-sm font-bold text-slate-900 py-4 px-6">Start Time</TableHead>
                    <TableHead className="text-sm font-bold text-slate-900 py-4 px-6">End Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getDatesList(addShiftData.dateFrom, addShiftData.dateTo).map((date, i) => {
                    const dateKey = formatDateKey(date);
                    const row = rowSchedules[dateKey] || { checked: true, hours: "", startTime: "", endTime: "" };
                    const rowMin = dateKey === today ? now : `${dateKey}T00:00`;

                    return (
                      <TableRow key={i} className="border-slate-50">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={row.checked}
                              onChange={(e) => handleRowChange(dateKey, 'checked', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-700">
                              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="e.g., 8"
                            value={row.hours}
                            onChange={(e) => {
                              const inputVal = e.target.value;
                              if (inputVal === "") {
                                handleRowChange(dateKey, 'hours', "");
                                return;
                              }
                              const valNum = Number(inputVal);
                              if (valNum < 0) {
                                return;
                              }
                              handleRowChange(dateKey, 'hours', inputVal);
                            }}
                            className="h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg font-medium text-slate-700"
                          />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="relative">
                            <Input
                              type="datetime-local"
                              min={rowMin}
                              value={row.startTime}
                              onChange={(e) => handleRowChange(dateKey, 'startTime', e.target.value)}
                              className="h-10 border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="relative">
                            <Input
                              type="datetime-local"
                              min={row.startTime || rowMin}
                              value={row.endTime}
                              onChange={(e) => handleRowChange(dateKey, 'endTime', e.target.value)}
                              className="h-10 border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancelAdd}
              className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Back
            </Button>
            <Button
              onClick={onCreateShifts}
              disabled={isCreating}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-10 rounded-lg font-bold shadow-md shadow-[#0064cb]/10 transition-all min-w-[120px] cursor-pointer"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
