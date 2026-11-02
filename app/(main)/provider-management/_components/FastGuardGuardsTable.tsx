"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import {
  ShieldCheck,
  Search,
  ChevronRight,
  ArrowLeft,
  User,
  Star,
  Info,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useDebounceValue from "@/hooks/use-debounce";
import {
  clientFetchGuardsNewAction,
  FetchGuardsByLocationParams,
} from "@/lib/client-actions";

const FASTGUARD_PERSONNEL_PROFILE_ID = "afa86a21-72e8-4629-85a7-b1f2052f278e";

export function FastGuardGuardsTable() {
  const router = useRouter();
  const [guards, setGuards] = useState<any[]>([]);
  const [totalGuards, setTotalGuards] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounceValue(searchQuery, 400);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [guardLevelFilter, setGuardLevelFilter] = useState("all");
  const [selectedAccountStatus, setSelectedAccountStatus] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  const [locations, setLocations] = useState<{
    countries: string[];
    states: string[];
    cities: string[];
  }>({
    countries: [],
    states: [],
    cities: [],
  });

  const isFilterActive =
    Boolean(searchQuery.trim()) ||
    serviceFilter !== "all" ||
    guardLevelFilter !== "all" ||
    selectedAccountStatus !== "all" ||
    selectedCountry !== "all" ||
    selectedState !== "all" ||
    selectedCity !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setServiceFilter("all");
    setGuardLevelFilter("all");
    setSelectedAccountStatus("all");
    setSelectedCountry("all");
    setSelectedState("all");
    setSelectedCity("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchLocations = async () => {
      try {
        const session = (await getSession()) as any;
        const token = session?.accessToken;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        let url = `${baseUrl}/api/v1/guard/location?status=approved`;
        if (selectedCountry && selectedCountry !== "all") {
          url += `&country=${encodeURIComponent(selectedCountry)}`;
        }
        if (selectedState && selectedState !== "all") {
          url += `&state=${encodeURIComponent(selectedState)}`;
        }
        if (FASTGUARD_PERSONNEL_PROFILE_ID) {
          url += `&personnel_profile_id=${encodeURIComponent(FASTGUARD_PERSONNEL_PROFILE_ID)}`;
        }

        let res = await fetch(url, {
          cache: "no-store",
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        let data = res.ok ? await res.json().catch(() => null) : null;
        const hasValidLocations =
          data &&
          data.success &&
          data.data &&
          Array.isArray(data.data.countries) &&
          data.data.countries.length > 0;

        if (!hasValidLocations) {
          let fallbackUrl = `${baseUrl}/api/v1/guard/location?status=approved`;
          if (selectedCountry && selectedCountry !== "all") {
            fallbackUrl += `&country=${encodeURIComponent(selectedCountry)}`;
          }
          if (selectedState && selectedState !== "all") {
            fallbackUrl += `&state=${encodeURIComponent(selectedState)}`;
          }
          const fallbackRes = await fetch(fallbackUrl, {
            cache: "no-store",
            headers: {
              "ngrok-skip-browser-warning": "true",
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json().catch(() => null);
            if (fallbackData?.success && fallbackData?.data) {
              data = fallbackData;
            }
          }
        }

        if (
          data &&
          data.success &&
          data.data &&
          typeof data.data === "object" &&
          !Array.isArray(data.data)
        ) {
          const sanitizeStrings = (arr: any) =>
            Array.isArray(arr)
              ? arr.filter((x: any) => typeof x === "string" && x.trim() !== "")
              : [];

          if (!isCancelled) {
            setLocations({
              countries: sanitizeStrings(data.data.countries),
              states: sanitizeStrings(data.data.states),
              cities: sanitizeStrings(data.data.cities),
            });
          }
        } else {
          if (!isCancelled) {
            setLocations({ countries: [], states: [], cities: [] });
          }
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        if (!isCancelled) {
          setLocations({ countries: [], states: [], cities: [] });
        }
      }
    };

    fetchLocations();
    return () => {
      isCancelled = true;
    };
  }, [selectedCountry, selectedState]);

  useEffect(() => {
    let isCancelled = false;

    const loadGuards = async () => {
      setIsLoading(true);

      const params: FetchGuardsByLocationParams = {
        page: currentPage,
        personnel_profile_id: FASTGUARD_PERSONNEL_PROFILE_ID,
      };

      if (selectedAccountStatus && selectedAccountStatus !== "all") {
        params.account_status = selectedAccountStatus;
      } else {
        params.account_status = "active";
      }

      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      if (serviceFilter && serviceFilter !== "all") {
        params.service = serviceFilter.toLowerCase();
      }

      if (guardLevelFilter && guardLevelFilter !== "all") {
        params.guard_level = guardLevelFilter;
      }

      if (selectedCountry && selectedCountry !== "all") {
        params.country = selectedCountry;
      }

      if (selectedState && selectedState !== "all") {
        params.states = selectedState;
      }

      if (selectedCity && selectedCity !== "all") {
        params.cities = selectedCity;
      }

      try {
        const res = await clientFetchGuardsNewAction(params);

        if (!isCancelled) {
          if (res.success && res.data) {
            const fastGuardOnly = res.data.filter((g: any) => {
              const profileId = String(
                g.personnel_profile?.id || g.personnel_profile_id || ""
              ).toLowerCase();
              if (profileId) {
                return profileId === FASTGUARD_PERSONNEL_PROFILE_ID.toLowerCase();
              }
              const profileType = String(
                g.personnel_profile?.type || g.personnel_profile?.profile_type || ""
              ).toLowerCase();
              if (profileType && (profileType === "agency" || profileType === "agent")) {
                return false;
              }
              return true;
            });

            setGuards(fastGuardOnly);
            const total = res.pagination?.total ?? fastGuardOnly.length;
            setTotalGuards(total);
            setTotalPages(
              res.pagination?.total_pages ?? Math.max(1, Math.ceil(total / pageSize))
            );
          } else {
            setGuards([]);
            setTotalGuards(0);
            setTotalPages(1);
            if (!res.success && (res as any).error) {
              toast.error((res as any).error);
            }
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to load guards:", err);
          setGuards([]);
          setTotalGuards(0);
          setTotalPages(1);
          toast.error(err?.message || "Failed to load guards");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadGuards();
    return () => {
      isCancelled = true;
    };
  }, [
    currentPage,
    debouncedSearchQuery,
    serviceFilter,
    guardLevelFilter,
    selectedAccountStatus,
    selectedCountry,
    selectedState,
    selectedCity,
  ]);

  const renderSelect = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    options: any[],
    allLabel: string
  ) => {
    const safeOptions: string[] = Array.isArray(options)
      ? options
        .map((opt: any) => {
          if (typeof opt === "string") return opt.trim();
          if (typeof opt === "number") return String(opt);
          if (opt && typeof opt === "object") {
            if (typeof opt.name === "string") return opt.name.trim();
            if (typeof opt.label === "string") return opt.label.trim();
            if (typeof opt.value === "string") return opt.value.trim();
            return "";
          }
          return "";
        })
        .filter((opt) => typeof opt === "string" && opt.length > 0)
      : [];

    return (
      <Select value={typeof value === "string" ? value : "all"} onValueChange={onChange}>
        <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200 shadow-xl text-xs z-[200] max-h-60">
          <SelectItem value="all" className="cursor-pointer text-xs">
            {allLabel}
          </SelectItem>
          {safeOptions.map((opt) => (
            <SelectItem key={opt} value={opt} className="cursor-pointer text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link
            href="/dashboard"
            className="hover:text-[#0064cb] transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Provider Management</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">FastGuard Service</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            FastGuard Service Guards
          </h1>
        </div>
      </div>

      <div className="w-full">
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
          <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0064cb]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  FastGuard Service Guards List
                </CardTitle>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  {totalGuards} Registered Guards
                </p>
              </div>
            </div>

            {isFilterActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3 text-xs font-semibold rounded-xl text-slate-600 hover:text-red-600 hover:border-red-200 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </CardHeader>

          <div className="p-4 sm:p-6 pb-4 bg-slate-50/40 border-b border-slate-100 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="space-y-1.5 md:col-span-3 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  Search
                </Label>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 pl-9 pr-9 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-3 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  Service
                </Label>
                <Select
                  value={serviceFilter}
                  onValueChange={(val) => {
                    setServiceFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl text-xs z-[200]">
                    <SelectItem value="all" className="cursor-pointer text-xs">
                      All
                    </SelectItem>
                    <SelectItem value="both" className="cursor-pointer text-xs">
                      Both
                    </SelectItem>
                    <SelectItem value="armed" className="cursor-pointer text-xs">
                      Armed
                    </SelectItem>
                    <SelectItem
                      value="unarmed"
                      className="cursor-pointer text-xs"
                    >
                      Unarmed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  Guard Level
                </Label>
                <Select
                  value={guardLevelFilter}
                  onValueChange={(val) => {
                    setGuardLevelFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl text-xs z-[200]">
                    <SelectItem value="all" className="cursor-pointer text-xs">
                      All
                    </SelectItem>
                    <SelectItem value="1" className="cursor-pointer text-xs">
                      Level 1
                    </SelectItem>
                    <SelectItem value="2" className="cursor-pointer text-xs">
                      Level 2
                    </SelectItem>
                    <SelectItem value="3" className="cursor-pointer text-xs">
                      Level 3
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  Status
                </Label>
                <Select
                  value={selectedAccountStatus}
                  onValueChange={(val) => {
                    setSelectedAccountStatus(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl text-xs z-[200]">
                    <SelectItem value="all" className="cursor-pointer text-xs">
                      All
                    </SelectItem>
                    <SelectItem value="active" className="cursor-pointer text-xs">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="cursor-pointer text-xs">
                      Inactive
                    </SelectItem>
                    <SelectItem value="blocked" className="cursor-pointer text-xs">
                      Blocked
                    </SelectItem>
                    <SelectItem value="archived" className="cursor-pointer text-xs">
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  Country
                </Label>
                {renderSelect(
                  selectedCountry,
                  (val) => {
                    setSelectedCountry(val);
                    setSelectedState("all");
                    setSelectedCity("all");
                    setCurrentPage(1);
                  },
                  "All Countries",
                  locations.countries,
                  "All Countries"
                )}
              </div>

              <div className="space-y-1.5 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  State
                </Label>
                {renderSelect(
                  selectedState,
                  (val) => {
                    setSelectedState(val);
                    setSelectedCity("all");
                    setCurrentPage(1);
                  },
                  "All States",
                  locations.states,
                  "All States"
                )}
              </div>

              <div className="space-y-1.5 w-full">
                <Label className="text-xs font-semibold text-slate-700">
                  City
                </Label>
                {renderSelect(
                  selectedCity,
                  (val) => {
                    setSelectedCity(val);
                    setCurrentPage(1);
                  },
                  "All Cities",
                  locations.cities,
                  "All Cities"
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Phone
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Guard Level
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">
                      Armed
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">
                      Unarmed
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Address
                    </TableHead>
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow
                        key={i}
                        className="hover:bg-transparent border-slate-50"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                            <Skeleton className="h-4 w-28 bg-slate-100" />
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-36 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-24 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-16 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <Skeleton className="h-4 w-8 mx-auto bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <Skeleton className="h-4 w-8 mx-auto bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-32 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Skeleton className="h-4 w-12 bg-slate-100" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : guards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShieldCheck className="w-12 h-12 text-slate-200" />
                          <p className="text-sm font-medium text-slate-700">
                            No guards found for FastGuard Service
                          </p>
                          {isFilterActive && (
                            <Button
                              onClick={handleResetFilters}
                              variant="outline"
                              className="mt-2 h-9 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    guards.map((guard) => {
                      const rawStatus = String(guard.account_status || "").toLowerCase().trim();
                      const isActive = rawStatus === "active" || (!rawStatus && guard.status !== false);
                      const isInactive = rawStatus === "inactive" || (!rawStatus && guard.status === false);
                      const isBlocked = rawStatus === "blocked";
                      const isArchived = rawStatus === "archived";

                      const badgeClass = isBlocked
                        ? "bg-red-50 text-red-600 border-red-200"
                        : isArchived
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : isInactive
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-green-50 text-green-600 border-green-200";

                      const statusLabel = rawStatus ? rawStatus.toUpperCase() : isActive ? "ACTIVE" : "INACTIVE";

                      const guardName =
                        `${guard.first_name || ""} ${guard.last_name || ""}`.trim() ||
                        "---";

                      return (
                        <TableRow
                          key={guard.guard_id || guard.id}
                          className="group hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (guard.application_id) {
                              router.push(
                                `/guard-bank/${guard.application_id}`
                              );
                            }
                          }}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                {guardName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">
                              {guard.email || "---"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                              {guard.phone_number || "---"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              {guard.guard_level === 3 ? (
                                <>
                                  <Star className="w-4 h-4 fill-purple-600 text-purple-600" />
                                  <Star className="w-4 h-4 fill-purple-600 text-purple-600" />
                                  <Star className="w-4 h-4 fill-purple-600 text-purple-600" />
                                </>
                              ) : guard.guard_level === 2 ? (
                                <>
                                  <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                                  <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                                </>
                              ) : guard.guard_level === 1 ? (
                                <>
                                  <Star className="w-4 h-4 fill-green-600 text-green-600" />
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs font-medium">
                                  ---
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-4 text-center">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                guard.armed ? "text-emerald-600" : "text-slate-700"
                              )}
                            >
                              {guard.armed ? "Yes" : "No"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-4 text-center">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                guard.unarmed ? "text-emerald-600" : "text-slate-700"
                              )}
                            >
                              {guard.unarmed ? "Yes" : "No"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <span
                              className="text-xs text-slate-800 font-medium block truncate max-w-[180px]"
                              title={guard.address}
                            >
                              {guard.address || "---"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap",
                                badgeClass
                              )}
                            >
                              {statusLabel}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {totalGuards > 0 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalGuards}
                limit={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                isPending={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
