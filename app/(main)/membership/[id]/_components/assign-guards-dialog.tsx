"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Star,
  Check,
  Loader2,
  XCircle,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { assignGuardsToMembershipAction } from "@/actions/membership.actions";
import { fetchLocationAction } from "@/actions/dashboard.actions";
import { clientFetchGuardsAction } from "@/lib/client-actions";
import useDebounceValue from "@/hooks/use-debounce";

interface AssignGuardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  membershipId: string;
  onSuccess: () => Promise<void>;
}

export function AssignGuardsDialog({
  isOpen,
  onClose,
  membershipId,
  onSuccess,
}: AssignGuardsDialogProps) {
  const [guards, setGuards] = useState<any[]>([]);
  const [isLoadingGuards, setIsLoadingGuards] = useState(true);
  const [guardSearch, setGuardSearch] = useState("");
  const debouncedGuardSearch = useDebounceValue(guardSearch, 400);

  const [guardFilters, setGuardFilters] = useState({
    country: "All Country",
    state: "All State",
    city: "All City",
    status: "all",
    level: "All",
  });

  const [locations, setLocations] = useState<{
    countries: string[];
    states: string[];
    cities: string[];
  }>({
    countries: ["All Country"],
    states: ["All State"],
    cities: ["All City"],
  });

  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Load locations dynamically
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetchLocationAction(
          guardFilters.country === "All Country" ? "" : guardFilters.country,
          guardFilters.state === "All State" ? "" : guardFilters.state,
          "approved"
        );
        if (res.success && res.data) {
          setLocations({
            countries: ["All Country", ...(res.data.countries || [])],
            states: ["All State", ...(res.data.states || [])],
            cities: ["All City", ...(res.data.cities || [])],
          });
        }
      } catch {}
    };
    if (isOpen) {
      loadLocations();
    }
  }, [guardFilters.country, guardFilters.state, isOpen]);

  // Load available guards with filters
  const loadGuards = useCallback(async () => {
    setIsLoadingGuards(true);
    try {
      const res = await clientFetchGuardsAction({
        page: null,
        search: debouncedGuardSearch,
        country: guardFilters.country === "All Country" ? "" : guardFilters.country,
        state: guardFilters.state === "All State" ? "" : guardFilters.state,
        city: guardFilters.city === "All City" ? "" : guardFilters.city,
        status: guardFilters.status === "all" ? "" : guardFilters.status,
        level: guardFilters.level === "All" ? "" : guardFilters.level,
      });
      if (res.success && Array.isArray(res.data)) {
        setGuards(res.data);
      } else {
        setGuards([]);
      }
    } catch {
      setGuards([]);
    } finally {
      setIsLoadingGuards(false);
    }
  }, [debouncedGuardSearch, guardFilters]);

  useEffect(() => {
    if (isOpen) {
      loadGuards();
    }
  }, [isOpen, loadGuards]);

  // Select all helpers
  const isAllSelected = useMemo(() => {
    if (guards.length === 0) return false;
    return guards.every((g) => {
      const id = g.guard_id || g.id;
      return selectedGuardIds.includes(id);
    });
  }, [guards, selectedGuardIds]);

  const isSomeSelected = useMemo(() => {
    if (guards.length === 0) return false;
    return (
      !isAllSelected &&
      guards.some((g) => {
        const id = g.guard_id || g.id;
        return selectedGuardIds.includes(id);
      })
    );
  }, [guards, selectedGuardIds, isAllSelected]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const currentIds = new Set(guards.map((g) => g.guard_id || g.id));
      setSelectedGuardIds((prev) => prev.filter((id) => !currentIds.has(id)));
    } else {
      const newIds = new Set(selectedGuardIds);
      guards.forEach((g) => {
        const id = g.guard_id || g.id;
        if (id) newIds.add(id);
      });
      setSelectedGuardIds(Array.from(newIds));
    }
  };

  const toggleGuard = (guardId: string) => {
    setSelectedGuardIds((prev) =>
      prev.includes(guardId) ? prev.filter((id) => id !== guardId) : [...prev, guardId]
    );
  };

  const resetState = useCallback(() => {
    setSelectedGuardIds([]);
    setGuardSearch("");
    setGuardFilters({
      country: "All Country",
      state: "All State",
      city: "All City",
      status: "all",
      level: "All",
    });
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const handleSaveAssignments = async () => {
    if (!membershipId) return;
    if (selectedGuardIds.length === 0) {
      toast.error("Please select at least one guard");
      return;
    }
    setIsSavingAssignments(true);
    try {
      const res = await assignGuardsToMembershipAction(membershipId, selectedGuardIds);
      if (res.success) {
        toast.success(res.message || "Guards assigned successfully");
        handleClose();
        await onSuccess();
      } else {
        toast.error(res.error || "Failed to assign guards");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving assignments";
      toast.error(msg);
    } finally {
      setIsSavingAssignments(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-[92vw] 2xl:max-w-7xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white h-[88vh] max-h-[88vh] flex flex-col gap-0 sm:left-[calc(50%+35px)]"
      >
        {/* Dialog Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Assign Guards
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                {guards.length} Guards total &bull;{" "}
                <span className="text-[#0064cb] font-bold">
                  {selectedGuardIds.length} Selected
                </span>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600 hover:text-slate-800 hover:rotate-90 duration-200 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dialog Body (Filters & Table) */}
        <div className="p-5 px-6 space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
          <div className="space-y-3 shrink-0">
            {/* Row 1: Country, State, City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[12px] font-semibold text-slate-700">Country</Label>
                <Select
                  value={guardFilters.country}
                  onValueChange={(val) =>
                    setGuardFilters((prev) => ({
                      ...prev,
                      country: val,
                      state: "All State",
                      city: "All City",
                    }))
                  }
                >
                  <SelectTrigger className="w-full !h-10 bg-slate-50 border-slate-200 text-xs sm:text-[13px] rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb]">
                    <SelectValue placeholder="All Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[250]">
                    {locations.countries.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs sm:text-[13px]">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[12px] font-semibold text-slate-700">State</Label>
                <Select
                  value={guardFilters.state}
                  onValueChange={(val) =>
                    setGuardFilters((prev) => ({
                      ...prev,
                      state: val,
                      city: "All City",
                    }))
                  }
                >
                  <SelectTrigger className="w-full !h-10 bg-slate-50 border-slate-200 text-xs sm:text-[13px] rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb]">
                    <SelectValue placeholder="All State" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[250]">
                    {locations.states.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs sm:text-[13px]">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[12px] font-semibold text-slate-700">City</Label>
                <Select
                  value={guardFilters.city}
                  onValueChange={(val) =>
                    setGuardFilters((prev) => ({
                      ...prev,
                      city: val,
                    }))
                  }
                >
                  <SelectTrigger className="w-full !h-10 bg-slate-50 border-slate-200 text-xs sm:text-[13px] rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb]">
                    <SelectValue placeholder="All City" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[250]">
                    {locations.cities.map((ct) => (
                      <SelectItem key={ct} value={ct} className="text-xs sm:text-[13px]">
                        {ct}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Search, Status, Guard Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[12px] font-semibold text-slate-700">Search</Label>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search name or email..."
                    value={guardSearch}
                    onChange={(e) => setGuardSearch(e.target.value)}
                    className="h-10 pl-9.5 pr-8 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs sm:text-[13px] font-medium text-slate-800"
                  />
                  {guardSearch && (
                    <button
                      onClick={() => setGuardSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[12px] font-semibold text-slate-700">Status</Label>
                <Select
                  value={guardFilters.status}
                  onValueChange={(val) =>
                    setGuardFilters((prev) => ({
                      ...prev,
                      status: val,
                    }))
                  }
                >
                  <SelectTrigger className="w-full !h-10 bg-slate-50 border-slate-200 text-xs sm:text-[13px] rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[250]">
                    <SelectItem value="all" className="text-xs sm:text-[13px]">
                      All Status
                    </SelectItem>
                    <SelectItem value="true" className="text-xs sm:text-[13px]">
                      Active
                    </SelectItem>
                    <SelectItem value="false" className="text-xs sm:text-[13px]">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[12px] font-semibold text-slate-700">Guard Level</Label>
                <Select
                  value={guardFilters.level}
                  onValueChange={(val) =>
                    setGuardFilters((prev) => ({
                      ...prev,
                      level: val,
                    }))
                  }
                >
                  <SelectTrigger className="w-full !h-10 bg-slate-50 border-slate-200 text-xs sm:text-[13px] rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[250]">
                    <SelectItem value="All" className="text-xs sm:text-[13px]">
                      All
                    </SelectItem>
                    <SelectItem value="1" className="text-xs sm:text-[13px]">
                      Level 1
                    </SelectItem>
                    <SelectItem value="2" className="text-xs sm:text-[13px]">
                      Level 2
                    </SelectItem>
                    <SelectItem value="3" className="text-xs sm:text-[13px]">
                      Level 3
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 bg-white">
            <Table
              className="min-w-full"
              containerClassName="overflow-y-auto overflow-x-auto flex-1 min-h-0"
              scrollbarClass="custom-scrollbar-visible"
            >
              <TableHeader className="bg-slate-50/70 sticky top-0 z-10 border-b border-slate-100">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-12 py-4 px-4 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                      title="Select / Unselect All"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-3 text-center">
                    #
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-4">
                    Guard Name
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-4">
                    Email
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-4">
                    Phone No.
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-4">
                    <div className="flex items-center gap-1">
                      Guard Level
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-4 px-6 text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingGuards ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-modal-${i}`} className="hover:bg-transparent border-slate-50">
                      <TableCell className="py-4 px-4 text-center">
                        <Skeleton className="w-4 h-4 mx-auto rounded bg-slate-100" />
                      </TableCell>
                      <TableCell className="py-4 px-3 text-center">
                        <Skeleton className="h-4 w-4 mx-auto bg-slate-100" />
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                          <Skeleton className="h-4 w-32 bg-slate-100" />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Skeleton className="h-4 w-40 bg-slate-100" />
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Skeleton className="h-4 w-28 bg-slate-100" />
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Skeleton className="h-4 w-16 bg-slate-100" />
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full bg-slate-100" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : guards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-9 h-9 text-slate-200" />
                        <p className="text-sm font-medium text-slate-700">No guards match the selected filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  guards.map((guard, index) => {
                    const id = guard.guard_id || guard.id;
                    const isChecked = selectedGuardIds.includes(id);

                    return (
                      <TableRow
                        key={id}
                        onClick={() => toggleGuard(id)}
                        className={cn(
                          "group hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer",
                          isChecked && "bg-blue-50/30"
                        )}
                      >
                        <TableCell
                          className="py-4 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleGuard(id)}
                            className="w-4 h-4 rounded text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                          />
                        </TableCell>

                        <TableCell className="text-xs text-slate-800 font-medium py-4 px-3 text-center">
                          {index + 1}
                        </TableCell>

                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs">
                              {guard.first_name?.charAt(0)?.toUpperCase() || "G"}
                            </div>
                            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                              {guard.first_name || "---"} {guard.last_name || ""}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-slate-800 font-medium py-4 px-4">
                          {guard.email || "—"}
                        </TableCell>

                        <TableCell className="text-xs text-slate-800 font-medium py-4 px-4">
                          {guard.phone_number || "—"}
                        </TableCell>

                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            {guard.guard_level === 3 ? (
                              <>
                                <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                                <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                                <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                              </>
                            ) : guard.guard_level === 2 ? (
                              <>
                                <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                                <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                              </>
                            ) : guard.guard_level === 1 ? (
                              <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">---</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 px-6 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap",
                              guard.status !== false
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            )}
                          >
                            {guard.status !== false ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-9 px-4 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAssignments}
            disabled={isSavingAssignments || selectedGuardIds.length === 0}
            className="h-9 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg font-bold shadow-md shadow-blue-200 transition-all active:scale-95 text-xs px-5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSavingAssignments ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Save ({selectedGuardIds.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
