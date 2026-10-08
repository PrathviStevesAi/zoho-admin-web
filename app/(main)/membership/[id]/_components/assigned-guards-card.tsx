import React, { useRef, useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  XCircle,
  QrCode,
  X,
  Upload,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MembershipAssignedGuardItem } from "@/actions/membership.actions";

interface AssignedGuardsCardProps {
  assignedGuards: MembershipAssignedGuardItem[];
  isLoading: boolean;
  assignedSearch: string;
  onSearchChange: (value: string) => void;
  assignedStatus: string;
  onStatusChange: (value: string) => void;
  assignedPage: number;
  onPageChange: (page: number) => void;
  assignedPageSize: number;
  assignedTotal: number;
  onOpenAssignGuards: () => void;
  onViewQr: (url: string, guardName: string) => void;
  onUploadQr: (guardId: string, file: File) => void;
  onRemoveQr: (guardId: string, guardName: string) => void;
  onRemoveGuard: (guardId: string, guardName: string) => void;
  onRemoveMultipleGuards?: (guardIds: string[], countLabel?: string) => void;
  onRemoveMultipleQrs?: (guardIds: string[], countLabel?: string) => void;
  uploadingQrGuardId: string | null;
}

export function AssignedGuardsCard({
  assignedGuards,
  isLoading,
  assignedSearch,
  onSearchChange,
  assignedStatus,
  onStatusChange,
  assignedPage,
  onPageChange,
  assignedPageSize,
  assignedTotal,
  onOpenAssignGuards,
  onViewQr,
  onUploadQr,
  onRemoveQr,
  onRemoveGuard,
  onRemoveMultipleGuards,
  onRemoveMultipleQrs,
  uploadingQrGuardId,
}: AssignedGuardsCardProps) {
  const guardQrInputRef = useRef<HTMLInputElement>(null);
  const [activeQrGuardId, setActiveQrGuardId] = useState<string | null>(null);

  const [deleteMode, setDeleteMode] = useState<"guards" | "qrs" | null>(null);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);

  const isFiltered = assignedStatus !== "all_guards" || Boolean(assignedSearch?.trim());

  const allCurrentGuardIds = assignedGuards
    .map((g) => g.guard_id)
    .filter(Boolean);

  const guardsWithQrIds = assignedGuards
    .filter((g) => Boolean(g.qr_code_url) || (g.status || "").toLowerCase() === "uploaded_qr")
    .map((g) => g.guard_id)
    .filter(Boolean);

  // Reset delete mode when page/filter or assignedGuards list changes
  useEffect(() => {
    setDeleteMode(null);
    setSelectedGuardIds([]);
  }, [assignedGuards, assignedPage, assignedStatus, assignedSearch]);

  const handleStartDeleteGuards = () => {
    setDeleteMode("guards");
    setSelectedGuardIds([...allCurrentGuardIds]);
  };

  const handleStartDeleteQrs = () => {
    setDeleteMode("qrs");
    setSelectedGuardIds([...guardsWithQrIds]);
  };

  const handleCancelDeleteMode = () => {
    setDeleteMode(null);
    setSelectedGuardIds([]);
  };

  const handleToggleGuardSelect = (guardId: string) => {
    setSelectedGuardIds((prev) =>
      prev.includes(guardId) ? prev.filter((id) => id !== guardId) : [...prev, guardId]
    );
  };

  const eligibleIds = deleteMode === "guards" ? allCurrentGuardIds : guardsWithQrIds;
  const isAllSelected = eligibleIds.length > 0 && eligibleIds.every((id) => selectedGuardIds.includes(id));
  const isSomeSelected =
    selectedGuardIds.some((id) => eligibleIds.includes(id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedGuardIds([]);
    } else {
      setSelectedGuardIds([...eligibleIds]);
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedGuardIds.length === 0) return;
    if (deleteMode === "guards") {
      onRemoveMultipleGuards?.(
        selectedGuardIds,
        `${selectedGuardIds.length} guard${selectedGuardIds.length > 1 ? "s" : ""}`
      );
    } else if (deleteMode === "qrs") {
      onRemoveMultipleQrs?.(
        selectedGuardIds,
        `${selectedGuardIds.length} QR code${selectedGuardIds.length > 1 ? "s" : ""}`
      );
    }
  };

  const handleTriggerUpload = (guardId: string) => {
    setActiveQrGuardId(guardId);
    if (guardQrInputRef.current) {
      guardQrInputRef.current.value = "";
      guardQrInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeQrGuardId) {
      onUploadQr(activeQrGuardId, file);
    }
  };

  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white !gap-0 !py-0">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Guards</h2>
            <p className="text-xs text-slate-500 font-medium">
              {assignedTotal} Guards assigned to this benefit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {deleteMode ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDeleteMode}
                className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={selectedGuardIds.length === 0}
                onClick={handleExecuteBulkDelete}
                className="h-9 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteMode === "guards"
                    ? `Delete (${selectedGuardIds.length}) Guards`
                    : `Delete (${selectedGuardIds.length}) QR Codes`}
                </span>
              </Button>
            </div>
          ) : (
            <>
              {assignedGuards.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-semibold transition-all active:scale-95 text-xs px-3.5 min-w-[165px] flex items-center justify-between gap-2 cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete All</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-red-500 opacity-80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[165px] bg-white border-slate-200 shadow-xl z-[200] p-1"
                  >
                    <DropdownMenuItem
                      onClick={handleStartDeleteGuards}
                      className="text-xs font-semibold text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer flex items-center gap-2 py-2 px-2.5 rounded-md"
                    >
                      <UserX className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>Delete All Guards</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleStartDeleteQrs}
                      disabled={guardsWithQrIds.length === 0}
                      className="text-xs font-semibold text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer flex items-center gap-2 py-2 px-2.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <QrCode className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>Delete All QR Codes</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                onClick={onOpenAssignGuards}
                className="h-9 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg font-bold shadow-md shadow-blue-200 transition-all active:scale-95 text-xs px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Guards
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-slate-100 bg-white">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
          <Input
            type="text"
            placeholder="Search guard name, email..."
            value={assignedSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 pr-8 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800"
          />
          {assignedSearch && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-56">
          <Select value={assignedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 shadow-xl z-[200]">
              <SelectItem value="all_guards" className="text-xs">
                All Status
              </SelectItem>
              <SelectItem value="uploaded_qr" className="text-xs">
                Uploaded QR
              </SelectItem>
              <SelectItem value="pending_qr" className="text-xs">
                Pending QR
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[620px] flex-1">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/40">
                <TableHead className="w-11 py-4 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={deleteMode ? isAllSelected : false}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(deleteMode && isSomeSelected);
                    }}
                    onChange={handleToggleSelectAll}
                    disabled={!deleteMode || eligibleIds.length === 0}
                    className={cn(
                      "w-4 h-4 rounded border-slate-300 transition-colors",
                      !deleteMode
                        ? "opacity-35 cursor-not-allowed"
                        : "text-[#0064cb] focus:ring-[#0064cb] cursor-pointer accent-[#0064cb]"
                    )}
                    title={
                      !deleteMode
                        ? 'Click "Delete All" above to enable selection'
                        : isAllSelected
                          ? "Unselect All"
                          : "Select All"
                    }
                  />
                </TableHead>
                <TableHead className="w-12 py-4 px-2 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  #
                </TableHead>
                <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Guard Name
                </TableHead>
                <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  QR Code
                </TableHead>
                <TableHead className="py-4 px-6 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`assigned-skel-${i}`} className="hover:bg-transparent border-slate-50">
                    <TableCell className="w-11 px-4 py-4 text-center">
                      <Skeleton className="h-4 w-4 rounded mx-auto bg-slate-100" />
                    </TableCell>
                    <TableCell className="w-12 px-2 py-4 text-center">
                      <Skeleton className="h-4 w-4 mx-auto bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                        <Skeleton className="h-4 w-32 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-4 w-44 bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-4 w-20 rounded-full bg-slate-100" />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Skeleton className="h-7 w-20 rounded-lg bg-slate-100" />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Skeleton className="w-8 h-8 rounded-full ml-auto bg-slate-50" />
                    </TableCell>
                  </TableRow>
                ))
              ) : assignedGuards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className={cn("text-center", isFiltered ? "h-36" : "h-52")}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-9 h-9 text-slate-200" />
                      <p className="text-sm font-medium text-slate-700">
                        {assignedStatus !== "all_guards"
                          ? "No assigned guards found this status"
                          : "No assigned guards found"}
                      </p>
                      {!isFiltered && (
                        <>
                          <p className="text-xs text-slate-400 max-w-xs">
                            Click the &ldquo;Add Guards&rdquo; button above to assign guards to this membership benefit.
                          </p>
                          <Button
                            onClick={onOpenAssignGuards}
                            variant="outline"
                            size="sm"
                            className="mt-1 h-8 text-xs font-bold text-[#0064cb] border-[#0064cb]/30 hover:bg-blue-50 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign Guards Now
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assignedGuards.map((guard, index) => {
                  const statusLower = (guard.status || "").toLowerCase();
                  const isUploadedQr = statusLower === "uploaded_qr" || Boolean(guard.qr_code_url);
                  const isPendingQr = statusLower === "pending_qr";

                  const isSelected = selectedGuardIds.includes(guard.guard_id);
                  const isQrDeleteEligible = isUploadedQr;
                  const isRowCheckboxDisabled =
                    !deleteMode || (deleteMode === "qrs" && !isQrDeleteEligible);

                  return (
                    <TableRow
                      key={guard.guard_id || index}
                      className={cn(
                        "group border-slate-50 transition-colors",
                        deleteMode && isSelected
                          ? "bg-red-50/30 hover:bg-red-50/50"
                          : "hover:bg-slate-50/50"
                      )}
                    >
                      <TableCell className="w-11 py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={deleteMode ? isSelected : false}
                          disabled={isRowCheckboxDisabled}
                          onChange={() => handleToggleGuardSelect(guard.guard_id)}
                          className={cn(
                            "w-4 h-4 rounded border-slate-300 transition-colors",
                            isRowCheckboxDisabled
                              ? "opacity-35 cursor-not-allowed"
                              : "text-[#0064cb] focus:ring-[#0064cb] cursor-pointer accent-[#0064cb]"
                          )}
                          title={
                            !deleteMode
                              ? 'Click "Delete All" above to enable selection'
                              : deleteMode === "qrs" && !isQrDeleteEligible
                                ? "No QR code to delete"
                                : isSelected
                                  ? "Uncheck to keep"
                                  : "Check to delete"
                          }
                        />
                      </TableCell>

                      <TableCell className="w-12 py-4 px-2 text-center">
                        <span className="text-xs text-slate-800 font-medium">
                          {(assignedPage - 1) * assignedPageSize + index + 1}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs">
                            {guard.full_name?.charAt(0)?.toUpperCase() || "G"}
                          </div>
                          <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                            {guard.full_name || "---"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <span className="text-xs text-slate-800 font-medium">
                          {guard.email || "—"}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block whitespace-nowrap",
                            isUploadedQr
                              ? "bg-green-50 text-green-600 border-green-200"
                              : isPendingQr
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                          )}
                        >
                          {isUploadedQr
                            ? "Uploaded QR"
                            : isPendingQr
                              ? "Pending QR"
                              : guard.status?.replace("_", " ") || "Assigned"}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        {guard.qr_code_url ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onViewQr(guard.qr_code_url!, guard.full_name || "Guard")}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0064cb] hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="View QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" /> View QR
                            </button>
                            <button
                              onClick={() => onRemoveQr(guard.guard_id, guard.full_name || "Guard")}
                              className="w-7 h-7 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove QR Code"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTriggerUpload(guard.guard_id)}
                            disabled={uploadingQrGuardId === guard.guard_id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0064cb] hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            title="Upload QR Code"
                          >
                            {uploadingQrGuardId === guard.guard_id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <span>Upload QR</span>
                              </>
                            )}
                          </button>
                        )}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onRemoveGuard(guard.guard_id, guard.full_name || "Guard")}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer shadow-xs border border-red-100"
                            title="Remove Guard"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <input
          ref={guardQrInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileSelected}
          className="hidden"
        />

        {assignedTotal > assignedPageSize && (
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-white">
            <span>
              Showing {(assignedPage - 1) * assignedPageSize + 1} -{" "}
              {Math.min(assignedPage * assignedPageSize, assignedTotal)} of {assignedTotal}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, assignedPage - 1))}
                disabled={assignedPage === 1 || isLoading}
                className="h-8 px-2.5 text-xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <span className="font-semibold text-slate-800">
                Page {assignedPage} of {Math.ceil(assignedTotal / assignedPageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onPageChange(
                    assignedPage < Math.ceil(assignedTotal / assignedPageSize)
                      ? assignedPage + 1
                      : assignedPage
                  )
                }
                disabled={
                  assignedPage >= Math.ceil(assignedTotal / assignedPageSize) || isLoading
                }
                className="h-8 px-2.5 text-xs cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
