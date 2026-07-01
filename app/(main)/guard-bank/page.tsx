"use client";

import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useDebounceValue from "@/hooks/use-debounce";
import {
  Home,
  Activity,
  CheckCircle,
  XCircle,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  CircleDot,
  UserX
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { GuardFilters } from "./components/guard-filters";
import { GuardsTable } from "./components/guards-table";
import { GuardCard } from "./components/guard-card";
import { GuardPriceTab } from "./components/guard-price-tab";
import { ConfirmationDialog } from "./components/confirmation-dialog";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "record-touch", label: "Record Touch", icon: Activity },
  { id: "approved", label: "Approved", icon: CheckCircle },
  { id: "disqualified", label: "Disqualified", icon: XCircle },
  { id: "guard-price", label: "Guard Price", icon: DollarSign },
];

export default function GuardBankPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState("home");
  const [guardsData, setGuardsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 500);
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
    cities: []
  });
  const [pricesData, setPricesData] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [selectedTerritory, setSelectedTerritory] = useState("all");
  const [submittingPrices, setSubmittingPrices] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    guardId: string;
  }>({ isOpen: false, guardId: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeTab !== "guard-price") return;

    const fetchPrices = async () => {
      setLoading(true);
      try {
        const session = await getSession() as any;
        const token = session?.accessToken;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        const res = await fetch(`${baseUrl}/api/v1/guard/price`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        const data = await res.json();
        if (data.success) {
          setPricesData(data.data || {});
        }
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [activeTab]);

  const handleSubmitPrices = async () => {
    setSubmittingPrices(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${baseUrl}/api/v1/guard/price`, {
        method: "PUT",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ data: pricesData })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Guard prices updated successfully!");
      } else {
        toast.error(data.message || "Failed to update guard prices.");
      }
    } catch (error: any) {
      console.error("Failed to submit prices:", error);
      toast.error(error.message || "An error occurred while saving prices.");
    } finally {
      setSubmittingPrices(false);
    }
  };

  useEffect(() => {
    setSelectedCountry("all");
    setSelectedState("all");
    setSelectedCity("all");
    setSearch("");
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCountry, selectedState, selectedCity]);

  useEffect(() => {
    const fetchLocations = async () => {
      let status = "";
      if (activeTab === "home") status = "pending";
      else if (activeTab === "record-touch") status = "record_touched";
      else if (activeTab === "approved") status = "approved";
      else if (activeTab === "disqualified") status = "disqualified";
      else return;

      try {
        const session = await getSession() as any;
        const token = session?.accessToken;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        let url = `${baseUrl}/api/v1/guard/location?status=${status}`;
        if (selectedCountry && selectedCountry !== "all") {
          url += `&country=${selectedCountry}`;
        }
        if (selectedState && selectedState !== "all") {
          url += `&state=${selectedState}`;
        }

        const res = await fetch(url, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        const data = await res.json();
        if (data.success) {
          setLocations(data.data || { countries: [], states: [], cities: [] });
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      }
    };

    fetchLocations();
  }, [activeTab, selectedCountry, selectedState]);

  const fetchGuards = async () => {
    let status = "";
    if (activeTab === "home") status = "pending";
    else if (activeTab === "record-touch") status = "record_touched";
    else if (activeTab === "approved") status = "approved";
    else if (activeTab === "disqualified") status = "disqualified";
    else return;

    setLoading(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      let url = `${baseUrl}/api/v1/guard/bank/application?status=${status}&page=${currentPage}&page_size=${pageSize}`;
      if (selectedCountry && selectedCountry !== "all") {
        url += `&country=${selectedCountry}`;
      }
      if (selectedState && selectedState !== "all") {
        url += `&state=${selectedState}`;
      }
      if (selectedCity && selectedCity !== "all") {
        url += `&city=${selectedCity}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      const res = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data.success) {
        setGuardsData(data.data);
        setTotalCount(data.total || 0);
      } else {
        setGuardsData([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch guards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, [activeTab, currentPage, pageSize, debouncedSearch, selectedCountry, selectedState, selectedCity]);

  const handleDeleteGuard = (id: string) => {
    setDeleteConfirm({ isOpen: true, guardId: id });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirm.guardId;
    if (!id) return;

    setIsDeleting(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (res.ok) {
        toast.success("Guard application deleted successfully");
        setDeleteConfirm({ isOpen: false, guardId: "" });
        fetchGuards();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || "Failed to delete guard application");
      }
    } catch (error) {
      console.error("Failed to delete guard:", error);
      toast.error("An error occurred while deleting the guard application");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewGuard = async (guard: any) => {
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${guard.id}/status/record_touched`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log("Status updated to Record Touched");
        router.push(`/guard-bank/${guard.id}`);
      } else {
        console.error(data.message || data.detail || "Failed to update guard status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("An error occurred while updating status");
    }
  };

  const renderPagination = () => {
    if (totalCount === 0 || loading) return null;
    const totalPages = Math.ceil(totalCount / pageSize);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);

    const getPages = () => {
      const pages = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between pt-6 mt-auto border-t border-slate-100">
        <div className="text-sm font-medium text-slate-500">
          Showing <span className="font-bold text-slate-700">{start}</span> to <span className="font-bold text-slate-700">{end}</span> of <span className="font-bold text-slate-700">{totalCount}</span> entries
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPages().map((p, i) => (
            p === '...' ? (
              <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold tracking-widest">...</span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p as number)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
                  currentPage === p
                    ? "bg-[#0064cb] text-white border border-[#0064cb] shadow-md shadow-blue-200/50"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {p}
              </button>
            )
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guard Bank</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guard Bank</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border-none overflow-hidden">
        <div className="flex overflow-x-auto p-5 border-b border-slate-100 bg-slate-50/50 space-x-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-[#0064cb] text-white shadow-lg shadow-blue-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 min-h-[500px] flex flex-col">
          {activeTab === "home" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 flex flex-col flex-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">New Guards</h2>
                <div className="text-sm font-semibold text-slate-600">Total: {totalCount}</div>
              </div>

              <div className="space-y-4">
                <GuardFilters
                  search={search}
                  setSearch={setSearch}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedState={selectedState}
                  setSelectedState={setSelectedState}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  locations={locations}
                  mounted={mounted}
                  isHomeTab={true}
                />

                <GuardsTable
                  guards={guardsData}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  loading={loading}
                  onView={handleViewGuard}
                />
              </div>
              {renderPagination()}
            </div>
          )}

          {activeTab === "record-touch" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 flex flex-col flex-1">
              <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Waiting for approval guards</h2>
                </div>
              </div>

              <div className="space-y-4">
                <GuardFilters
                  search={search}
                  setSearch={setSearch}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedState={selectedState}
                  setSelectedState={setSelectedState}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  locations={locations}
                  mounted={mounted}
                />

                <div className="pt-2">
                  <h3 className="text-[13px] font-bold text-slate-800">Total: {totalCount}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex gap-4">
                          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-20" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-24" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-40" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-28" /></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : guardsData.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 font-medium">No more data</div>
                  ) : guardsData.map((guard) => (
                    <GuardCard
                      key={guard.id}
                      guard={guard}
                      status="record_touched"
                      onDelete={handleDeleteGuard}
                    />
                  ))}
                </div>
              </div>
              {renderPagination()}
            </div>
          )}

          {activeTab === "approved" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 flex flex-col flex-1">
              <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-5 h-5 text-green-500" strokeWidth={2.5} />
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Approved Guards</h2>
                </div>
              </div>

              <div className="space-y-4">
                <GuardFilters
                  search={search}
                  setSearch={setSearch}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedState={selectedState}
                  setSelectedState={setSelectedState}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  locations={locations}
                  mounted={mounted}
                />

                <div className="pt-2">
                  <h3 className="text-[13px] font-bold text-slate-800">Total: {totalCount}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex gap-4">
                          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-20" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-24" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-40" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-28" /></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : guardsData.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 font-medium">No more data</div>
                  ) : guardsData.map((guard) => (
                    <GuardCard
                      key={guard.id}
                      guard={guard}
                      status="approved"
                      onDelete={handleDeleteGuard}
                    />
                  ))}
                </div>
              </div>
              {renderPagination()}
            </div>
          )}

          {activeTab === "disqualified" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 flex flex-col flex-1">
              <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Disqualified Guards</h2>
                </div>
              </div>

              <div className="space-y-4">
                <GuardFilters
                  search={search}
                  setSearch={setSearch}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedState={selectedState}
                  setSelectedState={setSelectedState}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  locations={locations}
                  mounted={mounted}
                />

                <div className="pt-2">
                  <h3 className="text-[13px] font-bold text-slate-800">Total: {totalCount}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex gap-4">
                          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-20" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-24" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-40" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-28" /></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : guardsData.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 font-medium">No more data</div>
                  ) : guardsData.map((guard) => (
                    <GuardCard
                      key={guard.id}
                      guard={guard}
                      status="disqualified"
                      onDelete={handleDeleteGuard}
                    />
                  ))}
                </div>
              </div>
              {renderPagination()}
            </div>
          )}

          {activeTab === "guard-price" && (
            <GuardPriceTab
              pricesData={pricesData}
              setPricesData={setPricesData}
              selectedTerritory={selectedTerritory}
              setSelectedTerritory={setSelectedTerritory}
              submittingPrices={submittingPrices}
              handleSubmitPrices={handleSubmitPrices}
              loading={loading}
              mounted={mounted}
            />
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, guardId: "" })}
        onConfirm={handleConfirmDelete}
        title="Delete Guard Application?"
        description="Are you sure you want to delete this guard application? This action cannot be undone."
        confirmText="Yes, delete it"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
