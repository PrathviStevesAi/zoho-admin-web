"use client";

import {
  clientFetchGuardsNewAction,
  clientResendGuardPasswordAction,
  clientFetchLocationAction,
  FetchGuardsByLocationParams,
} from "@/lib/client-actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useDebounceValue from "@/hooks/use-debounce";
import { ConfirmationDialog } from "@/app/(main)/guard-bank/components/confirmation-dialog";
import {
  Shield,
  Search,
  ChevronRight,
  ArrowLeft,
  User,
  UserPlus,
  Star,
  Info,
  MoreVertical,
  Eye,
  KeyRound,
  RotateCcw,
  XCircle,
  Building2,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { GuardRegistrationForm } from "./_components/guard-registration-form";
import Link from "next/link";
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
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/table/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const countries = [
  { name: "Argentina", code: "ar", dialCode: "+54" },
  { name: "Bolivia", code: "bo", dialCode: "+591" },
  { name: "Brazil", code: "br", dialCode: "+55" },
  { name: "Canada", code: "ca", dialCode: "+1" },
  { name: "Chile", code: "cl", dialCode: "+56" },
  { name: "Colombia", code: "co", dialCode: "+57" },
  { name: "Ecuador", code: "ec", dialCode: "+593" },
  { name: "Guyana", code: "gy", dialCode: "+592" },
  { name: "Paraguay", code: "py", dialCode: "+595" },
  { name: "Peru", code: "pe", dialCode: "+51" },
  { name: "Suriname", code: "sr", dialCode: "+597" },
  { name: "United States", code: "us", dialCode: "+1" },
  { name: "Uruguay", code: "uy", dialCode: "+598" },
  { name: "Venezuela", code: "ve", dialCode: "+58" }
];

export default function GuardDirectoryPage() {
  const router = useRouter();
  const [guards, setGuards] = useState<any[]>([]);
  const [resendPasswordConfirm, setResendPasswordConfirm] = useState<{
    isOpen: boolean;
    guardId: string;
    guardName: string;
  }>({ isOpen: false, guardId: "", guardName: "" });
  const [isResendingPassword, setIsResendingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounceValue(searchQuery, 400);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [guardLevelFilter, setGuardLevelFilter] = useState("all");
  const [appDownloadedFilter, setAppDownloadedFilter] = useState("all");
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
  const [view, setView] = useState<"list" | "register">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isFilterActive =
    searchQuery.trim() !== "" ||
    serviceFilter !== "all" ||
    guardLevelFilter !== "all" ||
    appDownloadedFilter !== "all" ||
    selectedCountry !== "all" ||
    selectedState !== "all" ||
    selectedCity !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setServiceFilter("all");
    setGuardLevelFilter("all");
    setAppDownloadedFilter("all");
    setSelectedCountry("all");
    setSelectedState("all");
    setSelectedCity("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    let isCancelled = false;
    const loadLocations = async () => {
      try {
        const countryParam =
          selectedCountry !== "all" && selectedCountry !== "All Country"
            ? selectedCountry
            : undefined;
        const stateParam =
          selectedState !== "all" && selectedState !== "All State"
            ? selectedState
            : undefined;

        const res = await clientFetchLocationAction(
          countryParam,
          stateParam,
          "approved"
        );
        if (!isCancelled && res.success && res.data) {
          const sanitizeStrings = (arr: any) =>
            Array.isArray(arr) ? arr.filter((x: any) => typeof x === "string" && x.trim() !== "") : [];
          setLocations({
            countries: sanitizeStrings(res.data.countries),
            states: sanitizeStrings(res.data.states),
            cities: sanitizeStrings(res.data.cities),
          });
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };

    loadLocations();
    return () => {
      isCancelled = true;
    };
  }, [selectedCountry, selectedState]);

  useEffect(() => {
    let isCancelled = false;

    const fetchGuards = async () => {
      setIsLoading(true);
      const params: FetchGuardsByLocationParams = {
        page: currentPage,
        account_status: "active",
      };

      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      if (serviceFilter && serviceFilter !== "all") {
        params.service = serviceFilter.toLowerCase();
      }

      if (guardLevelFilter && guardLevelFilter !== "all") {
        params.guard_level = guardLevelFilter;
      }

      if (appDownloadedFilter && appDownloadedFilter !== "all") {
        params.is_app_download = appDownloadedFilter;
      }

      if (selectedCountry && selectedCountry !== "all" && selectedCountry !== "All Country") {
        params.country = selectedCountry;
      }

      if (selectedState && selectedState !== "all" && selectedState !== "All State") {
        params.states = selectedState;
      }

      if (selectedCity && selectedCity !== "all" && selectedCity !== "All City") {
        params.cities = selectedCity;
      }

      try {
        const res = await clientFetchGuardsNewAction(params);
        if (!isCancelled) {
          if (res.success) {
            setGuards(res.data);
            setPagination(res.pagination);
          } else {
            toast.error(res.error || "Failed to load guards");
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          toast.error(err?.message || "Failed to load guards");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGuards();

    return () => {
      isCancelled = true;
    };
  }, [
    currentPage,
    debouncedSearchQuery,
    serviceFilter,
    guardLevelFilter,
    appDownloadedFilter,
    selectedCountry,
    selectedState,
    selectedCity,
    refreshKey,
  ]);

  const renderLocationSelect = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    options: string[],
    allLabel: string
  ) => {
    return (
      <Select value={value || "all"} onValueChange={onChange}>
        <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200 shadow-xl text-xs z-[200] max-h-60">
          <SelectItem value="all" className="cursor-pointer text-xs">
            {allLabel}
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="cursor-pointer text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const handleResendPassword = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setResendPasswordConfirm({ isOpen: true, guardId: id, guardName: name });
  };

  const handleConfirmResendPassword = async () => {
    const id = resendPasswordConfirm.guardId;
    if (!id) return;
    setIsResendingPassword(true);
    const res = await clientResendGuardPasswordAction(id);

    if (res.success) {
      toast.success(res.message || "Password sent successfully");
    } else {
      toast.error(res.error || "Failed to resend password");
    }
    setIsResendingPassword(false);
    setResendPasswordConfirm({ isOpen: false, guardId: "", guardName: "" });
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Users Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guards</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guards Directory</h1>
        </div>
      </div>

      <div className="w-full">
        {view === "register" ? (
          <GuardRegistrationForm
            onBack={() => {
              setView("list");
              setCurrentPage(1);
              setRefreshKey((prev) => prev + 1);
            }}
            countries={countries}
          />
        ) : (
          <div>
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
              <CardHeader className="relative p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Shield className="w-5 h-5 text-[#0064cb]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Guards List</CardTitle>
                    <div className="mt-0.5">
                      {isLoading ? (
                        <Skeleton className="h-3.5 w-28 mt-0.5" />
                      ) : (
                        <p className="text-xs text-slate-800 font-medium">
                          {pagination?.total ?? guards.length} Registered Guards
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {appDownloadedFilter === "true" && (
                  <div className="sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 flex items-center justify-center my-2 sm:my-0">
                    {isLoading ? (
                      <Skeleton className="h-7 w-48 rounded-full" />
                    ) : (
                      <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#0064cb]/10 text-[#0064cb] border border-[#0064cb]/20 shadow-sm">
                        Total App Download Count: {pagination?.total ?? 0}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                  {isFilterActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-10 px-3 text-xs font-semibold rounded-xl text-slate-600 hover:text-red-600 hover:border-red-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => setView("register")}
                    className="h-10 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 px-4 whitespace-nowrap cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add New Guard
                  </Button>
                </div>
              </CardHeader>

              <div className="p-4 sm:p-6 pb-4 bg-slate-50/40 border-b border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1.5 w-full">
                    <Label className="text-xs font-semibold text-slate-700">Search</Label>
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

                  <div className="space-y-1.5 w-full">
                    <Label className="text-xs font-semibold text-slate-700">Services</Label>
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
                        <SelectItem value="all" className="cursor-pointer text-xs">All</SelectItem>
                        <SelectItem value="both" className="cursor-pointer text-xs">Both</SelectItem>
                        <SelectItem value="armed" className="cursor-pointer text-xs">Armed</SelectItem>
                        <SelectItem value="unarmed" className="cursor-pointer text-xs">Unarmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 w-full">
                    <Label className="text-xs font-semibold text-slate-700">Guard Level</Label>
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
                        <SelectItem value="all" className="cursor-pointer text-xs">All</SelectItem>
                        <SelectItem value="1" className="cursor-pointer text-xs">Level 1</SelectItem>
                        <SelectItem value="2" className="cursor-pointer text-xs">Level 2</SelectItem>
                        <SelectItem value="3" className="cursor-pointer text-xs">Level 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 w-full">
                    <Label className="text-xs font-semibold text-slate-700">App Downloaded</Label>
                    <Select
                      value={appDownloadedFilter}
                      onValueChange={(val) => {
                        setAppDownloadedFilter(val);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-xl text-xs z-[200]">
                        <SelectItem value="all" className="cursor-pointer text-xs">All</SelectItem>
                        <SelectItem value="true" className="cursor-pointer text-xs">Yes</SelectItem>
                        <SelectItem value="false" className="cursor-pointer text-xs">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1.5 w-full">
                    <Label className="text-xs font-semibold text-slate-700">Country</Label>
                    {renderLocationSelect(
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
                    <Label className="text-xs font-semibold text-slate-700">State</Label>
                    {renderLocationSelect(
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
                    <Label className="text-xs font-semibold text-slate-700">City</Label>
                    {renderLocationSelect(
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
                  <Table className="min-w-[1150px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Name</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Provider Name</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Profile Type</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Guard Level
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">App Download</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Armed</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Unarmed</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Address</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="py-4 px-6 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} className="hover:bg-transparent border-slate-50">
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                                <Skeleton className="h-4 w-24 bg-slate-100" />
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-28 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-20 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-16 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-12 mx-auto bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-8 mx-auto bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-8 mx-auto bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-32 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-12 bg-slate-100" /></TableCell>
                            <TableCell className="px-6 py-4 text-right"><Skeleton className="w-24 h-8 rounded-lg ml-auto bg-slate-50" /></TableCell>
                          </TableRow>
                        ))
                      ) : guards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="h-96 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Shield className="w-12 h-12 text-slate-200" />
                              <p className="text-sm font-medium text-slate-700">No guards found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        guards.map((guard) => {
                          const rawType = String(
                            guard.personnel_profile?.profile_type ||
                            guard.personnel_profile?.type ||
                            guard.profile_type ||
                            ""
                          ).toLowerCase().trim();
                          const profileName = guard.personnel_profile?.name;
                          const providerName = profileName || (rawType === "fastguard" ? "FastGuard Service" : "---");

                          const profileId =
                            guard.personnel_profile?.id ||
                            guard.personnel_profile?.profile_id ||
                            guard.personnel_profile_id;

                          const isFastGuard =
                            rawType === "fastguard" ||
                            profileId === "afa86a21-72e8-4629-85a7-b1f2052f278e" ||
                            (Boolean(profileName) && profileName.toLowerCase().includes("fastguard"));

                          const providerHref =
                            isFastGuard
                              ? `/provider-management/fastguard`
                              : profileId && (rawType === "agency" || rawType === "agent")
                              ? `/provider-management/${rawType}/${profileId}`
                              : null;

                          return (
                          <TableRow
                            key={guard.guard_id}
                            className="group hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer"
                            onClick={() => {
                              if (guard.application_id) {
                                router.push(`/guard-bank/${guard.application_id}`);
                              }
                            }}
                          >
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                  {guard.first_name || "---"} {guard.last_name || "---"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium">{guard.email}</span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium whitespace-nowrap">{guard.phone_number || "---"}</span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              {providerHref && providerName !== "---" ? (
                                <Link
                                  href={providerHref}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold text-[#0064cb] hover:underline whitespace-nowrap"
                                  title={providerName}
                                >
                                  {providerName}
                                </Link>
                              ) : providerName !== "---" ? (
                                <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                                  {providerName}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs font-medium">---</span>
                              )}
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              {(() => {
                                if (rawType === "agency") {
                                  return (
                                    <span
                                      title={profileName || "Agency"}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 capitalize whitespace-nowrap"
                                    >
                                      <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                      Agency
                                    </span>
                                  );
                                }
                                if (rawType === "agent") {
                                  return (
                                    <span
                                      title={profileName || "Agent"}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize whitespace-nowrap"
                                    >
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      Agent
                                    </span>
                                  );
                                }
                                if (rawType === "fastguard") {
                                  return (
                                    <span
                                      title={profileName || "FastGuard Service"}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0064cb] border border-blue-200 capitalize whitespace-nowrap"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 text-[#0064cb] shrink-0" />
                                      FastGuard
                                    </span>
                                  );
                                }
                                return <span className="text-slate-400 text-xs font-medium">---</span>;
                              })()}
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
                                  <span className="text-slate-400 text-xs font-medium">---</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase whitespace-nowrap",
                                  guard.is_app_download
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                )}
                              >
                                {guard.is_app_download ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <span className={cn(
                                "text-xs font-bold",
                                guard.armed ? "text-emerald-600" : "text-slate-700"
                              )}>
                                {guard.armed ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <span className={cn(
                                "text-xs font-bold",
                                guard.unarmed ? "text-emerald-600" : "text-slate-700"
                              )}>
                                {guard.unarmed ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium block truncate max-w-[150px]" title={guard.address}>
                                {guard.address || "---"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              {(() => {
                                const isActive = guard.account_status
                                  ? guard.account_status.toLowerCase() === "active"
                                  : guard.status !== false;
                                return (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap",
                                    isActive
                                      ? "bg-green-50 text-green-600 border-green-200"
                                      : "bg-red-50 text-red-600 border-red-200"
                                  )}>
                                    {isActive ? "Active" : "Inactive"}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => router.push(`/guard-overview?guard_id=${guard.guard_id || guard.id || ""}&returnTo=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/users-directory/guards")}`)} className="cursor-pointer py-2">
                                      <Eye className="mr-2 h-4 w-4 text-slate-500" />
                                      <span className="font-medium">Guard Overview</span>
                                    </DropdownMenuItem>
                                    <div className="py-1">
                                      <DropdownMenuSeparator />
                                    </div>
                                    <DropdownMenuItem onClick={(e) => handleResendPassword(e, guard.guard_id, `${guard.first_name || ""} ${guard.last_name || ""}`.trim())} className="cursor-pointer py-2 text-[#0064cb] focus:text-[#0052ae]">
                                      <KeyRound className="mr-2 h-4 w-4" />
                                      <span className="font-medium">Resend Password</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {isLoading ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-8 w-60 rounded-md" />
                  </div>
                ) : pagination ? (
                  <Pagination
                    page={currentPage}
                    totalPages={pagination.total_pages || pagination.pages || 1}
                    totalItems={pagination.total}
                    limit={pagination.limit || 10}
                    onPageChange={(page) => setCurrentPage(page)}
                    isPending={isLoading}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <ConfirmationDialog
        isOpen={resendPasswordConfirm.isOpen}
        onClose={() => setResendPasswordConfirm({ isOpen: false, guardId: "", guardName: "" })}
        onConfirm={handleConfirmResendPassword}
        title="Are you sure?"
        description={`You are about to resend the password for guard ${resendPasswordConfirm.guardName}.`}
        confirmText="Yes"
        cancelText="Cancel"
        isDanger={false}
        isLoading={isResendingPassword}
      />
    </div>
  );
}
