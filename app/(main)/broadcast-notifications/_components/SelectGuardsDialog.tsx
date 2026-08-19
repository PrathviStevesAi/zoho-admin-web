"use client";

import {
  clientFetchGuardsAction
} from "@/lib/client-actions";
import { useState, useEffect } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLocationAction } from "@/actions/dashboard.actions";
import useDebounceValue from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/types/dashboard.types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export interface GuardItem {
  guard_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  armed?: boolean;
  unarmed?: boolean;
  address?: string;
  status?: boolean;
}

interface SelectGuardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (guardIds: string[]) => void;
  initialSelectedIds: string[];
}

export function SelectGuardsDialog({ isOpen, onClose, onConfirm, initialSelectedIds }: SelectGuardsDialogProps) {
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilters, setUserFilters] = useState({
    country: "All Country",
    state: "All State",
    city: "All City",
    status: "all",
    service: "All"
  });
  const [locations, setLocations] = useState<{ countries: string[], states: string[], cities: string[] }>({
    countries: [],
    states: [],
    cities: []
  });
  const [guards, setGuards] = useState<GuardItem[]>([]);
  const [isLoadingGuards, setIsLoadingGuards] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounceValue(userSearchQuery, 500);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const isFilterActive =
    debouncedSearchQuery !== "" ||
    userFilters.country !== "All Country" ||
    userFilters.state !== "All State" ||
    userFilters.city !== "All City" ||
    userFilters.status !== "all" ||
    userFilters.service !== "All";

  useEffect(() => {
    if (!isOpen) {
      setUserSearchQuery("");
      setUserFilters({
        country: "All Country",
        state: "All State",
        city: "All City",
        status: "all",
        service: "All"
      });
      setCurrentPage(1);
      setShowMobileFilters(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const loadLocations = async () => {
        const res = await fetchLocationAction(userFilters.country, userFilters.state, "approved");
        if (res.success && res.data) {
          setLocations({
            countries: ["All Country", ...res.data.countries],
            states: ["All State", ...res.data.states],
            cities: ["All City", ...res.data.cities]
          });
        }
      };
      loadLocations();
    }
  }, [isOpen, userFilters.country, userFilters.state]);

  useEffect(() => {
    if (isOpen) {
      const loadGuards = async () => {
        setIsLoadingGuards(true);
        let armed = "";
        let unarmed = "";
        if (userFilters.service === "armed") armed = "true";
        if (userFilters.service === "unarmed") unarmed = "true";
        if (userFilters.service === "both") { armed = "true"; unarmed = "true"; }

        const res = await clientFetchGuardsAction({
          page: isFilterActive ? null : currentPage,
          search: debouncedSearchQuery,
          status: userFilters.status === "all" ? "" : userFilters.status,
          city: userFilters.city === "All City" ? "" : userFilters.city,
          state: userFilters.state === "All State" ? "" : userFilters.state,
          country: userFilters.country === "All Country" ? "" : userFilters.country,
          armed,
          unarmed
        });
        if (res.success && res.data) {
          setGuards(res.data);
          setPagination(res.pagination);
        }
        setIsLoadingGuards(false);
      };
      loadGuards();
    }
  }, [isOpen, currentPage, debouncedSearchQuery, userFilters]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] 2xl:max-w-7xl p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white max-h-[90vh] flex flex-col sm:left-[calc(50%+35px)]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">Select Guards</DialogTitle>
            <DialogDescription className="sr-only">
              Search and select multiple guards to send blast messages.
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50/10">
          <div className="space-y-2 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
              <div className="space-y-1 md:col-span-12">
                <Label className="text-[12px] font-semibold text-slate-700">Search</Label>
                <div className="relative w-full">
                  <Input
                    value={userSearchQuery || ""}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name or email..."
                    className="w-full h-9 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-xs"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => {
                        setUserSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-350 hover:text-slate-800 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="md:hidden w-full">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(prev => !prev)}
                  className="h-9 px-4 rounded-lg font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer w-full"
                >
                  <span>{showMobileFilters ? "Hide Filters" : "Show Filters"}</span>
                  <span className={`transition-transform duration-200 text-[8px] ${showMobileFilters ? "rotate-180" : ""}`}>▼</span>
                </button>
              </div>
            </div>

            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 md:grid",
              showMobileFilters ? "grid" : "hidden"
            )}>
              <div className="space-y-1 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">Country</Label>
                <Select
                  value={userFilters.country}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, country: val }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full !h-9 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[200] text-xs">
                    {locations.countries.map(country => (
                      <SelectItem key={country} value={country} className="cursor-pointer text-xs">{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">State</Label>
                <Select
                  value={userFilters.state}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, state: val }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full !h-9 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[200] text-xs">
                    {locations.states.map(state => (
                      <SelectItem key={state} value={state} className="cursor-pointer text-xs">{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">City</Label>
                <Select
                  value={userFilters.city}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, city: val }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full !h-9 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[200] text-xs">
                    {locations.cities.map(city => (
                      <SelectItem key={city} value={city} className="cursor-pointer text-xs">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">Status</Label>
                <Select
                  value={userFilters.status}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, status: val }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full !h-9 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[200] text-xs">
                    <SelectItem value="all" className="cursor-pointer text-xs">All Status</SelectItem>
                    <SelectItem value="true" className="cursor-pointer text-xs">Active</SelectItem>
                    <SelectItem value="false" className="cursor-pointer text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">Service</Label>
                <Select
                  value={userFilters.service}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, service: val }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full !h-9 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[200] text-xs">
                    <SelectItem value="All" className="cursor-pointer text-xs">All</SelectItem>
                    <SelectItem value="both" className="cursor-pointer text-xs">Both</SelectItem>
                    <SelectItem value="armed" className="cursor-pointer text-xs">Armed</SelectItem>
                    <SelectItem value="unarmed" className="cursor-pointer text-xs">Unarmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0 bg-white shadow-sm">
            <Table className="border-collapse min-w-[1200px]">
              <TableHeader className="bg-white sticky top-0 z-20">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="w-[80px] py-2.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-r border-slate-100 text-center">
                    <input
                      type="checkbox"
                      checked={guards.length > 0 && guards.every(g => selectedIds.includes(g.guard_id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newIds = [...selectedIds];
                          guards.forEach(g => {
                            if (!newIds.includes(g.guard_id)) {
                              newIds.push(g.guard_id);
                            }
                          });
                          setSelectedIds(newIds);
                        } else {
                          const visibleIds = guards.map(g => g.guard_id);
                          setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-350 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="w-[60px] text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100 text-center">#</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100">NAME</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100">EMAIL</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100">PHONE NO.</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100 text-center">ARMED</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100 text-center">UNARMED</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100">ADDRESS</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 text-center">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingGuards ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`skel-${i}`} className="border-b border-slate-50">
                      <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <Skeleton className="w-4 h-4 rounded mx-auto" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <Skeleton className="h-4 w-6 rounded mx-auto" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100">
                        <Skeleton className="h-4 w-28 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100">
                        <Skeleton className="h-4 w-36 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100">
                        <Skeleton className="h-4 w-24 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <Skeleton className="h-4 w-8 rounded mx-auto" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <Skeleton className="h-4 w-8 rounded mx-auto" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <Skeleton className="h-5 w-14 rounded-full mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : guards.length > 0 ? (
                  guards.map((guard, index) => (
                    <TableRow key={guard.guard_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-2.5 px-4 border-r border-slate-200/80 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(guard.guard_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, guard.guard_id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== guard.guard_id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-350 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-800 py-2.5 px-4 border-r border-slate-200/80 text-center font-medium">
                        {(currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold text-slate-700 py-2.5 px-4 border-r border-slate-200/80">
                        {guard.first_name} {guard.last_name}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 font-medium">
                        {guard.email}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 font-medium">
                        {guard.phone_number || "-"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 text-center font-medium">
                        {guard.armed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 text-center font-medium">
                        {guard.unarmed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 font-medium">
                        {guard.address || "-"}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-center font-medium">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          guard.status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {guard.status ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-slate-700">No guards found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {!isFilterActive && pagination && pagination.total_pages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
                <span className="text-xs text-slate-700 font-medium">
                  Showing Page {currentPage} of {pagination.total_pages} ({pagination.total} guards total)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="cursor-pointer text-xs rounded-xl h-8 bg-white"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pagination.total_pages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="cursor-pointer text-xs rounded-xl h-8 bg-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end bg-white gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-lg cursor-pointer text-xs transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(selectedIds);
              onClose();
            }}
            className="h-9 px-6 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold rounded-lg cursor-pointer text-xs shadow-sm transition-all"
          >
            Select Guards ({selectedIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
