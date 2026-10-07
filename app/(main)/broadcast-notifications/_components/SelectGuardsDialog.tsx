"use client";

import {
  clientFetchGuardsNewAction,
  FetchGuardsByLocationParams
} from "@/lib/client-actions";
import { useState, useEffect } from "react";
import { XCircle, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLocationAction } from "@/actions/dashboard.actions";
import useDebounceValue from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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
  guard_level?: number;
  account_status?: string;
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
    service: "All",
    level: "All"
  });
  const [locations, setLocations] = useState<{ countries: string[], states: string[], cities: string[] }>({
    countries: [],
    states: [],
    cities: []
  });
  const [guards, setGuards] = useState<GuardItem[]>([]);
  const [totalGuards, setTotalGuards] = useState<number>(0);
  const [isLoadingGuards, setIsLoadingGuards] = useState(false);
  const debouncedSearchQuery = useDebounceValue(userSearchQuery, 500);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const isFilterActive =
    Boolean(debouncedSearchQuery && debouncedSearchQuery.trim()) ||
    (userFilters.country && userFilters.country !== "All Country") ||
    (userFilters.state && userFilters.state !== "All State") ||
    (userFilters.city && userFilters.city !== "All City") ||
    (userFilters.service && userFilters.service !== "All") ||
    (userFilters.level && userFilters.level !== "All");

  useEffect(() => {
    if (!isOpen) {
      setUserSearchQuery("");
      setUserFilters({
        country: "All Country",
        state: "All State",
        city: "All City",
        service: "All",
        level: "All"
      });
      setShowMobileFilters(false);
      setTotalGuards(0);
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
        const params: FetchGuardsByLocationParams = {
          account_status: "active",
          page: isFilterActive ? null : 1
        };

        if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
          params.search = debouncedSearchQuery.trim();
        }

        if (userFilters.city && userFilters.city !== "All City") {
          params.cities = userFilters.city;
        }
        if (userFilters.state && userFilters.state !== "All State") {
          params.states = userFilters.state;
        }
        if (userFilters.country && userFilters.country !== "All Country") {
          params.country = userFilters.country;
        }

        if (userFilters.service && userFilters.service !== "All") {
          params.service = userFilters.service.toLowerCase();
        }

        if (userFilters.level && userFilters.level !== "All") {
          params.guard_level = userFilters.level;
        }

        const res = await clientFetchGuardsNewAction(params);
        if (res.success && res.data) {
          setGuards(res.data);
          setTotalGuards(res.pagination?.total ?? res.data.length);
        } else {
          setGuards([]);
          setTotalGuards(0);
        }
        setIsLoadingGuards(false);
      };
      loadGuards();
    }
  }, [isOpen, debouncedSearchQuery, userFilters, isFilterActive]);

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

        <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50/10">
          <div className="space-y-2.5 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
              <div className="space-y-1 md:col-span-8 lg:col-span-9 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">Search</Label>
                <div className="relative w-full">
                  <Input
                    value={userSearchQuery || ""}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                    }}
                    placeholder="Search name or email..."
                    className="w-full h-10 bg-white border-slate-200 focus:border-[#0064cb] focus:ring-[#0064cb]/10 rounded-lg text-sm"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => {
                        setUserSearchQuery("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-350 hover:text-slate-800 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-end md:col-span-4 lg:col-span-3 w-full">
                <div className="space-y-1 flex-1 w-full">
                  <Label className="text-[12px] font-semibold text-slate-700">Service</Label>
                  <Select
                    value={userFilters.service}
                    onValueChange={(val) => {
                      setUserFilters(prev => ({ ...prev, service: val }));
                    }}
                  >
                    <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
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

                <button
                  type="button"
                  onClick={() => setShowMobileFilters(prev => !prev)}
                  className="md:hidden h-10 px-3 rounded-lg font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>{showMobileFilters ? "Hide" : "Filters"}</span>
                  <span className={`transition-transform duration-200 text-[8px] ${showMobileFilters ? "rotate-180" : ""}`}>▼</span>
                </button>
              </div>
            </div>

            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 md:grid",
              showMobileFilters ? "grid" : "hidden"
            )}>
              <div className="space-y-1 w-full">
                <Label className="text-[12px] font-semibold text-slate-700">Country</Label>
                <Select
                  value={userFilters.country}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, country: val, state: "All State", city: "All City" }));
                  }}
                >
                  <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
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
                    setUserFilters(prev => ({ ...prev, state: val, city: "All City" }));
                  }}
                >
                  <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
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
                  }}
                >
                  <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
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
                <Label className="text-[12px] font-semibold text-slate-700">Guard Level</Label>
                <Select
                  value={userFilters.level}
                  onValueChange={(val) => {
                    setUserFilters(prev => ({ ...prev, level: val }));
                  }}
                >
                  <SelectTrigger className="w-full !h-10 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg cursor-pointer text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[200] text-xs">
                    <SelectItem value="All" className="cursor-pointer text-xs">All</SelectItem>
                    <SelectItem value="1" className="cursor-pointer text-xs">1 Star</SelectItem>
                    <SelectItem value="2" className="cursor-pointer text-xs">2 Stars</SelectItem>
                    <SelectItem value="3" className="cursor-pointer text-xs">3 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-50/60 border border-blue-100/80 text-slate-600 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0064cb] shrink-0" />
              <span>
                {isFilterActive
                  ? "Displaying filtered guards."
                  : "Displaying 10 guards by default. Use the search or filters above to find specific guards."}
              </span>
            </div>
            {guards.length > 0 && (
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap hidden sm:inline">
                Showing {guards.length} of {totalGuards || guards.length} guards
              </span>
            )}
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
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100">
                    <div className="flex items-center gap-1">
                      GUARD LEVEL
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100 text-center">ARMED</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4 border-r border-slate-100 text-center">UNARMED</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-2.5 px-4">ADDRESS</TableHead>
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
                      <TableCell className="py-3.5 px-4 border-r border-slate-100">
                        <Skeleton className="h-4 w-16 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <Skeleton className="h-4 w-8 rounded mx-auto" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <Skeleton className="h-4 w-8 rounded mx-auto" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <Skeleton className="h-4 w-32 rounded" />
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
                        {index + 1}
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
                      <TableCell className="py-2.5 px-4 border-r border-slate-200/80 font-medium">
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
                            <>
                              <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">---</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 text-center font-medium">
                        {guard.armed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 border-r border-slate-200/80 text-center font-medium">
                        {guard.unarmed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 py-2.5 px-4 font-medium">
                        {guard.address || "-"}
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
