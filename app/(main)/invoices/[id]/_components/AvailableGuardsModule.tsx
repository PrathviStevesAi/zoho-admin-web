"use client";

import Link from "next/link";
import {
  clientFetchGuardsNewAction,
  clientFetchLocationAction,
  FetchGuardsByLocationParams
} from "@/lib/client-actions";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Loader2,
  ChevronRight,
  UserCheck,
  CalendarDays,
  Star,
  Info,
  ArrowLeft,
  Smartphone,
  MessageSquare,
  MapPin,
  Globe,
  Building2,
  Map,
  Search,
  Download,
  Send,
  X,
  Shield,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { Country, State, City } from "country-state-city";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { findAvailableGuardsAction } from "@/actions/dashboard.actions";
import useDebounceValue from "@/hooks/use-debounce";
import { DynamicGuardsMap } from "./DynamicGuardsMap";

interface AvailableGuardsModuleProps {
  invoiceId: string;
  invoice?: any;
  guards: any[];
  shifts: any[];
  isLoading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  totalGuards: number;
}

function getCoordinatesFromLocation(locationText: string): [number, number] | null {
  if (!locationText) return null;
  const parts = locationText.split(",").map(p => p.trim());

  // Check each part for city match
  for (const rawPart of parts) {
    const part = rawPart.split("-")[0].trim();
    if (part) {
      const foundCity = City.getAllCities().find(
        c => c.name.toLowerCase() === part.toLowerCase()
      );
      if (foundCity && foundCity.latitude && foundCity.longitude) {
        return [parseFloat(foundCity.latitude), parseFloat(foundCity.longitude)];
      }
    }
  }

  // Check each part for state or country match
  for (const rawPart of parts) {
    const part = rawPart.split("-")[0].trim();
    if (part) {
      const foundState = State.getAllStates().find(
        s => s.name.toLowerCase() === part.toLowerCase() || s.isoCode.toLowerCase() === part.toLowerCase()
      );
      if (foundState && foundState.latitude && foundState.longitude) {
        return [parseFloat(foundState.latitude), parseFloat(foundState.longitude)];
      }

      const foundCountry = Country.getAllCountries().find(
        c => c.name.toLowerCase() === part.toLowerCase() || c.isoCode.toLowerCase() === part.toLowerCase()
      );
      if (foundCountry && foundCountry.latitude && foundCountry.longitude) {
        return [parseFloat(foundCountry.latitude), parseFloat(foundCountry.longitude)];
      }
    }
  }

  return null;
}

export function AvailableGuardsModule({
  invoiceId,
  invoice,
  guards: results,
  shifts,
  isLoading: isResultsLoading,
  onBack,
  onRefresh,
  totalGuards
}: AvailableGuardsModuleProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [allGuards, setAllGuards] = useState<any[]>([]);
  const [isGuardsLoading, setIsGuardsLoading] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [guardSearchQuery, setGuardSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const debouncedSearchQuery = useDebounceValue(guardSearchQuery, 500);
  const [notificationSource, setNotificationSource] = useState<"in_app" | "sms" | "both">("both");
  const [locationType, setLocationType] = useState<"radius" | "city" | "state" | "country" | "all">("radius");
  const [serviceFilter, setServiceFilter] = useState<"both" | "armed" | "unarmed">("both");

  const dynamicSiteLocation = useMemo(() => {
    // 1. Check history for "Site Location"
    if (Array.isArray(invoice?.history)) {
      for (const h of invoice.history) {
        let details = h?.details;
        if (typeof details === "string") {
          try {
            details = JSON.parse(details);
          } catch {}
        }
        if (details && typeof details === "object") {
          if (details["Site Location"]) {
            return String(details["Site Location"]).trim();
          }
          if (details["site_location"]) {
            return String(details["site_location"]).trim();
          }
          if (details["Location"]) {
            return String(details["Location"]).trim();
          }
        }
      }
    }

    // 2. Direct invoice properties if present
    if (invoice?.site_location) return String(invoice.site_location).trim();
    if (invoice?.location) return String(invoice.location).trim();

    // 3. Fallback to formatting from shipping_address (street, city, state, country - zip)
    if (invoice?.shipping_address) {
      if (typeof invoice.shipping_address === "string") return invoice.shipping_address.trim();
      const addr = invoice.shipping_address;
      const countryZip = addr.country && addr.zip
        ? `${addr.country} - ${addr.zip}`
        : (addr.country || addr.zip || "");
      const parts = [
        addr.street || addr.address,
        addr.city,
        addr.state,
        countryZip
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return "Site Location";
  }, [invoice]);

  const defaultRadius = 50;

  const initialCoordinates: [number, number] = useMemo(() => {
    // 1. Check direct invoice latitude & longitude
    if (invoice?.latitude !== undefined && invoice?.latitude !== null && invoice?.longitude !== undefined && invoice?.longitude !== null) {
      const lat = Number(invoice.latitude);
      const lng = Number(invoice.longitude);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return [lat, lng];
      }
    }
    // 2. Check shipping_address latitude & longitude
    if (invoice?.shipping_address?.latitude && invoice?.shipping_address?.longitude) {
      const lat = Number(invoice.shipping_address.latitude);
      const lng = Number(invoice.shipping_address.longitude);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return [lat, lng];
      }
    }
    const resolved = getCoordinatesFromLocation(dynamicSiteLocation);
    if (resolved) return resolved;
    return [22.7041853, 75.8427014];
  }, [invoice, dynamicSiteLocation]);

  const [centerLocation, setCenterLocation] = useState(dynamicSiteLocation);
  const [radiusMiles, setRadiusMiles] = useState<number>(50);
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [includeNearby, setIncludeNearby] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCoordinates);

  useEffect(() => {
    if (dynamicSiteLocation && dynamicSiteLocation !== "Site Location") {
      setCenterLocation(dynamicSiteLocation);
    }
  }, [dynamicSiteLocation]);

  useEffect(() => {
    setMapCenter(initialCoordinates);
  }, [initialCoordinates]);

  const [apiLocations, setApiLocations] = useState<{
    countries: string[];
    states: string[];
    cities: string[];
  }>({
    countries: [],
    states: [],
    cities: []
  });
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLocationsLoading(true);
      const res = await clientFetchLocationAction(undefined, undefined, "approved");
      if (res.success && res.data) {
        setApiLocations({
          countries: Array.isArray(res.data.countries) ? res.data.countries : [],
          states: Array.isArray(res.data.states) ? res.data.states : [],
          cities: Array.isArray(res.data.cities) ? res.data.cities : []
        });
      }
      setIsLocationsLoading(false);
    };
    fetchLocations();
  }, []);

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [citySelectKey, setCitySelectKey] = useState(0);
  const [stateSelectKey, setStateSelectKey] = useState(0);
  const [countrySelectKey, setCountrySelectKey] = useState(0);

  const handleAddCity = (cityName: string) => {
    if (!cityName) return;
    if (!selectedCities.includes(cityName)) {
      setSelectedCities((prev) => [...prev, cityName]);
    }
  };

  const handleRemoveCity = (nameToRemove: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== nameToRemove));
  };

  const handleAddState = (stateName: string) => {
    if (!stateName) return;
    if (!selectedStates.includes(stateName)) {
      setSelectedStates((prev) => [...prev, stateName]);
    }
  };

  const handleRemoveState = (nameToRemove: string) => {
    setSelectedStates((prev) => prev.filter((s) => s !== nameToRemove));
  };

  const handleAddCountry = (countryName: string) => {
    if (!countryName) return;
    if (!selectedCountries.includes(countryName)) {
      setSelectedCountries((prev) => [...prev, countryName]);
    }
  };

  const handleRemoveCountry = (nameToRemove: string) => {
    setSelectedCountries((prev) => prev.filter((c) => c !== nameToRemove));
  };

  const activeLocationDisplayName = useMemo(() => {
    if (locationType === "radius" && centerLocation) {
      return centerLocation;
    }
    return dynamicSiteLocation;
  }, [locationType, centerLocation, dynamicSiteLocation]);

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (hasSearched && activeStep === 2) {
      loadGuards();
    }
  }, [currentPage]);

  const loadGuards = async () => {
    setIsGuardsLoading(true);
    setHasSearched(true);

    const params: FetchGuardsByLocationParams = {
      account_status: "active",
      page: currentPage,
      search: debouncedSearchQuery || undefined,
      service: serviceFilter,
    };

    if (locationType === "radius") {
      params.location_type = "geographic_area";
      params.radius = radiusMiles;
      if (centerLocation) {
        params.location = centerLocation;
      }
    } else if (locationType === "city") {
      params.location_type = "cities";
      if (selectedCities.length > 0) {
        params.cities = selectedCities;
      }
    } else if (locationType === "state") {
      params.location_type = "states";
      if (selectedStates.length > 0) {
        params.states = selectedStates;
      }
    } else if (locationType === "country") {
      params.location_type = "country";
      if (selectedCountries.length > 0) {
        params.country = selectedCountries;
      }
    }

    const res = await clientFetchGuardsNewAction(params);

    if (res.success) {
      const data = res.data || [];
      setAllGuards(data);
      setPagination(res.pagination);
      if (data.length > 0) {
        setSelectedGuardIds(data.map((g: any) => g.guard_id));
      } else {
        setSelectedGuardIds([]);
      }
    } else {
      toast.error(res.error || "Failed to load guards");
    }
    setIsGuardsLoading(false);
  };

  const handleLocationTypeChange = (type: "radius" | "city" | "state" | "country" | "all") => {
    setLocationType(type);
    setMapCenter(initialCoordinates);
  };

  const handleCenterLocationChange = (val: string) => {
    setCenterLocation(val);
    const coords = getCoordinatesFromLocation(val);
    if (coords) {
      setMapCenter(coords);
    }
  };

  const handleSelectShift = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedShiftIds(prev => [...prev, id]);
    } else {
      setSelectedShiftIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAllShifts = (checked: boolean) => {
    if (checked) {
      setSelectedShiftIds(shifts.map(s => s.shift_id));
    } else {
      setSelectedShiftIds([]);
    }
  };

  const handleSelectGuard = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedGuardIds(prev => [...prev, id]);
    } else {
      setSelectedGuardIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAllGuards = (checked: boolean) => {
    if (checked) {
      setSelectedGuardIds(allGuards.map(g => g.guard_id));
    } else {
      setSelectedGuardIds([]);
    }
  };

  const handleFind = async () => {
    if (selectedShiftIds.length === 0) {
      toast.error("Please select at least one shift");
      setActiveStep(1);
      return;
    }
    if (selectedGuardIds.length === 0) {
      toast.error("Please select at least one guard");
      return;
    }

    setIsFinding(true);
    try {
      const res = await findAvailableGuardsAction({
        invoice_id: invoiceId,
        shift_ids: selectedShiftIds,
        guard_ids: selectedGuardIds,
        location: activeLocationDisplayName || centerLocation || "",
        source: notificationSource || "both",
      });

      if (res.success) {
        toast.success(res.message || `Job opportunity sent successfully to ${selectedGuardIds.length} guard(s)`);
        if (onRefresh) onRefresh();
        setActiveStep(0);
        setSelectedShiftIds([]);
        setSelectedGuardIds([]);
      } else {
        toast.error(res.error || "Failed to send job opportunity");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send job opportunity");
    } finally {
      setIsFinding(false);
    }
  };

  const resetFilters = () => {
    setGuardSearchQuery("");
    setLocationType("radius");
    setServiceFilter("both");
    setRadiusMiles(50);
    setCenterLocation(dynamicSiteLocation);
    setMapCenter(initialCoordinates);
    setSelectedCities([]);
    setSelectedStates([]);
    setSelectedCountries([]);
    setOnlyEligible(true);
    setIncludeNearby(true);
    setCurrentPage(1);
    setAllGuards([]);
    setHasSearched(false);
  };

  const handleExportList = () => {
    if (allGuards.length === 0) {
      toast.error("No guards to export");
      return;
    }
    try {
      const headers = [
        "#",
        "NAME",
        "EMAIL",
        "CITY, STATE",
        ...(locationType === "radius" ? ["DISTANCE"] : []),
        "ARMED",
        "UNARMED",
        "STATUS"
      ];
      const rows = [
        headers,
        ...allGuards.map((g, idx) => [
          idx + 1,
          `${g.first_name || ""} ${g.last_name || ""}`.trim() || g.name || "-",
          g.email || "-",
          getCityState(g, idx),
          ...(locationType === "radius" ? [getDistance(g)] : []),
          g.armed ? "Yes" : "No",
          g.unarmed ? "Yes" : "No",
          g.status !== false ? "Active" : "Inactive"
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `guards_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Guards list exported successfully");
    } catch (err) {
      toast.error("Failed to export list");
    }
  };

  const formatArray = (arr: any[] | null) => {
    if (!arr || arr.length === 0) return "----";
    return arr.join(", ");
  };

  const getCityState = (guard: any, index?: number) => {
    if (guard.city && guard.state) return `${guard.city}, ${guard.state}`;
    if (guard.city) return guard.city;
    if (guard.state) return guard.state;
    if (guard.address) return guard.address;
    return "-";
  };

  const getDistance = (guard: any) => {
    if (guard?.distance_miles !== undefined && guard?.distance_miles !== null && guard?.distance_miles !== "") {
      const val = guard.distance_miles;
      if (typeof val === "number") {
        return `${val.toFixed(1)} mi`;
      }
      return typeof val === "string" && val.endsWith("mi") ? val : `${val} mi`;
    }
    return "-";
  };

  const getLastActive = (guard: any, index: number) => {
    if (guard.last_active_at) {
      try {
        const d = new Date(guard.last_active_at);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } catch { }
    }
    const sampleDates = ["Oct 1, 2026", "Sep 30, 2026", "Sep 28, 2026", "Sep 29, 2026", "Sep 30, 2026"];
    return sampleDates[index % sampleDates.length];
  };

  const renderGuardLevelStars = (level: number | undefined, index: number) => {
    const effectiveLevel = level !== undefined && level !== null ? level : (index % 2 === 0 ? 2 : 1);
    if (effectiveLevel === 3) {
      return (
        <div className="flex items-center gap-0.5">
          <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
          <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
          <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
        </div>
      );
    }
    if (effectiveLevel === 2) {
      return (
        <div className="flex items-center gap-0.5">
          <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
          <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
        </div>
      );
    }
    if (effectiveLevel === 1) {
      return (
        <div className="flex items-center gap-0.5">
          <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
        </div>
      );
    }
    return <span className="text-slate-400 text-xs">--</span>;
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center py-3 px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setActiveStep(1)}
          disabled={activeStep === 1}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full transition-all cursor-pointer",
            activeStep === 1
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200"
              : "bg-white text-slate-600 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb]"
          )}
        >
          <div className={cn(
            "w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[11px]",
            activeStep === 1 ? "bg-white/20" : "bg-slate-100"
          )}>
            1
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">Select Shift</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

        <button
          onClick={() => {
            if (selectedShiftIds.length === 0 && activeStep !== 2) {
              toast.error("Please select shifts first");
              return;
            }
            setActiveStep(2);
          }}
          disabled={activeStep === 2 || (activeStep === 0)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full transition-all",
            activeStep === 2
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200"
              : activeStep === 1
                ? "bg-white text-slate-600 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb] cursor-pointer"
                : "bg-slate-50 text-slate-700 border border-slate-300 opacity-60 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[11px]",
            activeStep === 2 ? "bg-white/20" : "bg-slate-100"
          )}>
            2
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">Select Guard</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {renderStepper()}

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {activeStep === 0
                  ? "Available Guards"
                  : activeStep === 1
                    ? "Select Shifts"
                    : "Select Guards"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {activeStep === 0 ? (
                  <>
                    Total available guards found:{" "}
                    <span className="font-semibold text-[#0064cb]">{totalGuards}</span>
                  </>
                ) : activeStep === 1 ? (
                  "You can select multiple shifts"
                ) : (
                  "Choose guards manually or use location filters to send job opportunity."
                )}
              </p>
            </div>

            {activeStep === 2 ? (
              <Button
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="px-4 h-9 rounded-lg font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Shift
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={activeStep === 0 ? onBack : () => {
                  setActiveStep(0);
                  resetFilters();
                }}
                className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto text-center shrink-0"
              >
                {activeStep === 0 ? "Back" : "Cancel"}
              </Button>
            )}
          </div>

          <div className="p-0">
            {activeStep === 0 ? (
              <div className="overflow-x-auto custom-scrollbar w-full">
                <Table className="min-w-[900px] md:min-w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Guard Name</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Email</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Total Shifts Sent</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Available For Shifts</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Unavailable For Shifts</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Seen</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4 text-center">Responded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isResultsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0064cb]" />
                        </TableCell>
                      </TableRow>
                    ) : results.length > 0 ? (
                      results.map((guard, index) => (
                        <TableRow key={guard.notification_id || index} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-2.5 px-4 text-sm font-bold text-slate-700">{guard.guard_name}</TableCell>
                          <TableCell className="py-2.5 px-4 text-sm font-medium text-slate-800">{guard.email}</TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                              {formatArray(guard.total_shifts_sent)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                              {formatArray(guard.available_for_shifts)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                              {formatArray(guard.unavailable_for_shifts)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                              guard.notification_seen ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-700"
                            )}>
                              {guard.notification_seen ? "Seen" : "Unseen"}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                              guard.is_responded ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-700"
                            )}>
                              {guard.is_responded ? "Responded" : "No Response"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-slate-700 font-medium">No available guards found for this invoice.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : activeStep === 1 ? (
              <div className="overflow-x-auto custom-scrollbar w-full">
                <Table className="min-w-[650px] md:min-w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[60px] py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                          checked={shifts.length > 0 && selectedShiftIds.length === shifts.length}
                          onChange={(e) => handleSelectAllShifts(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Shift No.</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Service Name</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">Start Time</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-800 uppercase py-2.5 px-4">End Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.length > 0 ? (
                      shifts.map((shift) => (
                        <TableRow key={shift.shift_id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              checked={selectedShiftIds.includes(shift.shift_id)}
                              onChange={(e) => handleSelectShift(shift.shift_id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-bold text-slate-700 py-2.5 px-4">
                            <Link
                              href={`/shift/view?shift_id=${shift.shift_id}`}
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
                      ))
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
            ) : activeStep === 2 ? (
              <div className="space-y-0">
                <div className="px-6 py-4 border-b border-slate-100 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-0.5 lg:max-w-xs shrink-0">
                      <h3 className="text-sm font-bold text-slate-900">Notification Source</h3>
                      <p className="text-xs text-slate-500">
                        Select how you want to send the job opportunity to guards.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-4xl">
                      <div
                        onClick={() => setNotificationSource("in_app")}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                          notificationSource === "in_app"
                            ? "border-2 border-[#0064cb] bg-blue-50/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">In App Notification</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Send notification inside the Fast Guard app</p>
                          </div>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                          notificationSource === "in_app"
                            ? "border-2 border-[#0064cb]"
                            : "border-slate-300"
                        )}>
                          {notificationSource === "in_app" && <div className="w-2 h-2 rounded-full bg-[#0064cb]" />}
                        </div>
                      </div>

                      <div
                        onClick={() => setNotificationSource("sms")}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                          notificationSource === "sms"
                            ? "border-2 border-[#0064cb] bg-blue-50/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageSquare className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">SMS (Text Message)</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Send SMS with job link (deep link to app)</p>
                          </div>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                          notificationSource === "sms"
                            ? "border-2 border-[#0064cb]"
                            : "border-slate-300"
                        )}>
                          {notificationSource === "sms" && <div className="w-2 h-2 rounded-full bg-[#0064cb]" />}
                        </div>
                      </div>

                      <div
                        onClick={() => setNotificationSource("both")}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                          notificationSource === "both"
                            ? "border-2 border-[#0064cb] bg-blue-50/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center -space-x-1 shrink-0 text-[#0064cb]">
                            <Smartphone className="w-4 h-4" />
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0064cb] leading-tight">Both (Recommended)</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Send in-app notification and SMS with job link</p>
                          </div>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                          notificationSource === "both"
                            ? "border-2 border-[#0064cb]"
                            : "border-slate-300"
                        )}>
                          {notificationSource === "both" && <div className="w-2 h-2 rounded-full bg-[#0064cb]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b border-slate-100 bg-white">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4 space-y-4 bg-white">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-800">Location Type</Label>
                        <Select
                          value={locationType}
                          onValueChange={(val: any) => handleLocationTypeChange(val)}
                        >
                          <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {locationType === "radius" && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                              {locationType === "city" && <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                              {locationType === "state" && <Map className="w-3.5 h-3.5 text-blue-600" />}
                              {locationType === "country" && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                              {locationType === "all" && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                              <span>
                                {locationType === "radius" && "Geographic Area ( Radius )"}
                                {locationType === "city" && "City"}
                                {locationType === "state" && "State"}
                                {locationType === "country" && "Country"}
                                {locationType === "all" && "All Locations (All Guards)"}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
                            <SelectItem value="radius" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                <span>Geographic Area ( Radius )</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="city" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>City</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="state" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <Map className="w-3.5 h-3.5 text-blue-600" />
                                <span>State</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="country" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                <span>Country</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="all" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>All Locations (All Guards)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-800">Service</Label>
                        <Select
                          value={serviceFilter}
                          onValueChange={(val: "both" | "armed" | "unarmed") => setServiceFilter(val)}
                        >
                          <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-blue-600" />
                              <span>
                                {serviceFilter === "both" && "Both"}
                                {serviceFilter === "armed" && "Armed"}
                                {serviceFilter === "unarmed" && "Unarmed"}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
                            <SelectItem value="both" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-blue-600" />
                                <span>Both</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="armed" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                                <span>Armed</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="unarmed" className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Unarmed</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {locationType === "radius" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Site Location</Label>
                            <div className="relative">
                              <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <Input
                                value={centerLocation}
                                onChange={(e) => handleCenterLocationChange(e.target.value)}
                                placeholder="Site Location or Address"
                                className="w-full h-10 pl-9 pr-8 bg-white border-slate-200 rounded-lg text-xs text-slate-800 focus:border-[#0064cb] focus:ring-[#0064cb]/10"
                              />
                              {centerLocation && (
                                <button
                                  type="button"
                                  onClick={() => handleCenterLocationChange("")}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Radius (Miles)</Label>
                            <div className="flex items-center gap-3">
                              <div className="relative w-36 shrink-0 flex items-center">
                                <Input
                                  type="number"
                                  min={5}
                                  max={5000}
                                  step={5}
                                  value={radiusMiles}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setRadiusMiles(val > 0 ? val : 50);
                                  }}
                                  className="w-full h-10 pr-14 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:border-[#0064cb]"
                                />
                                <div className="absolute right-1 flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setRadiusMiles((prev) => Math.max(5, prev - 5))}
                                    className="w-6 h-7 flex items-center justify-center rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                                    title="Decrease by 5 miles"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRadiusMiles((prev) => prev + 5)}
                                    className="w-6 h-7 flex items-center justify-center rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                                    title="Increase by 5 miles"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 font-normal">
                                Find guards within {radiusMiles} miles.
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {locationType === "city" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-800">City</Label>
                          <Select
                            key={citySelectKey}
                            onValueChange={(val) => {
                              if (val && val !== "__none__") {
                                handleAddCity(val);
                                setCitySelectKey((k) => k + 1);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                              <SelectValue placeholder={isLocationsLoading ? "Loading cities..." : "Select City"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 max-h-56">
                              {apiLocations.cities.length === 0 ? (
                                <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                                  {isLocationsLoading ? "Loading cities..." : "No cities found"}
                                </SelectItem>
                              ) : (
                                apiLocations.cities
                                  .filter((c) => !selectedCities.includes(c))
                                  .map((city) => (
                                    <SelectItem key={city} value={city} className="text-xs cursor-pointer">
                                      {city}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedCities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {selectedCities.map((cityName) => (
                                <span
                                  key={cityName}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                                >
                                  <span>{cityName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCity(cityName)}
                                    className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                                    title={`Remove ${cityName}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {locationType === "state" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-800">State</Label>
                          <Select
                            key={stateSelectKey}
                            onValueChange={(val) => {
                              if (val && val !== "__none__") {
                                handleAddState(val);
                                setStateSelectKey((k) => k + 1);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                              <SelectValue placeholder={isLocationsLoading ? "Loading states..." : "Select State"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 max-h-56">
                              {apiLocations.states.length === 0 ? (
                                <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                                  {isLocationsLoading ? "Loading states..." : "No states found"}
                                </SelectItem>
                              ) : (
                                apiLocations.states
                                  .filter((s) => !selectedStates.includes(s))
                                  .map((state) => (
                                    <SelectItem key={state} value={state} className="text-xs cursor-pointer">
                                      {state}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedStates.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {selectedStates.map((stateName) => (
                                <span
                                  key={stateName}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                                >
                                  <span>{stateName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveState(stateName)}
                                    className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                                    title={`Remove ${stateName}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {locationType === "country" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-800">Country</Label>
                          <Select
                            key={countrySelectKey}
                            onValueChange={(val) => {
                              if (val && val !== "__none__") {
                                handleAddCountry(val);
                                setCountrySelectKey((k) => k + 1);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                              <SelectValue placeholder={isLocationsLoading ? "Loading countries..." : "Select Country"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 max-h-56">
                              {apiLocations.countries.length === 0 ? (
                                <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                                  {isLocationsLoading ? "Loading countries..." : "No countries found"}
                                </SelectItem>
                              ) : (
                                apiLocations.countries
                                  .filter((c) => !selectedCountries.includes(c))
                                  .map((country) => (
                                    <SelectItem key={country} value={country} className="text-xs cursor-pointer">
                                      {country}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedCountries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {selectedCountries.map((countryName) => (
                                <span
                                  key={countryName}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                                >
                                  <span>{countryName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCountry(countryName)}
                                    className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                                    title={`Remove ${countryName}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {locationType === "all" && (
                        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                          <Info className="w-4 h-4 text-[#0064cb] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">All Locations</span>
                            <span>Fetches all active guards without location restrictions.</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          type="button"
                          disabled={isGuardsLoading}
                          onClick={loadGuards}
                          className="h-10 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg text-xs font-bold shadow-md shadow-[#0064cb]/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          {isGuardsLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>Search Guards</span>
                        </Button>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="text-xs font-bold text-[#0064cb] hover:underline cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate max-w-[50%]">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{activeLocationDisplayName}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {locationType === "radius" ? (
                            <span>Radius: <strong className="text-slate-900">{radiusMiles} miles</strong></span>
                          ) : (
                            <span>Type: <strong className="text-slate-900 capitalize">{locationType === "all" ? "All Locations" : locationType}</strong></span>
                          )}
                          <span className="text-slate-300">|</span>
                          <span>Service: <strong className="text-slate-900 capitalize">{serviceFilter}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>Guards found: <strong className="text-[#0064cb] font-bold">{allGuards.length}</strong></span>
                        </div>
                      </div>

                      <DynamicGuardsMap
                        center={mapCenter}
                        radiusMiles={radiusMiles}
                        centerLocationName={activeLocationDisplayName}
                        guardsFoundCount={allGuards.length}
                        guards={allGuards}
                        locationType={locationType}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white">
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900">
                        Guards ({allGuards.length} found)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Showing guards {locationType === "radius" ? `within ${radiusMiles} miles of ` : locationType === "all" ? "across " : "for "}{activeLocationDisplayName.split(",")[0]}. Select guards to send the job opportunity.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative w-52 sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={guardSearchQuery}
                          onChange={(e) => setGuardSearchQuery(e.target.value)}
                          placeholder="Search guards..."
                          className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50/60 border-slate-200 rounded-lg focus:bg-white"
                        />
                        {guardSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setGuardSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleExportList}
                        className="px-3.5 h-8 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export List
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar w-full">
                    <Table className="min-w-[1100px] md:min-w-full">
                      <TableHeader className="bg-slate-50/60">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="w-[50px] py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              checked={allGuards.length > 0 && selectedGuardIds.length === allGuards.length}
                              onChange={(e) => handleSelectAllGuards(e.target.checked)}
                            />
                          </TableHead>
                          <TableHead className="w-[50px] text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3 text-center">#</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">NAME</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">EMAIL</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">CITY, STATE</TableHead>
                          {locationType === "radius" && (
                            <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">DISTANCE</TableHead>
                          )}
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4 text-center">ARMED</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4 text-center">UNARMED</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4 text-center">STATUS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isGuardsLoading ? (
                          <TableRow>
                            <TableCell colSpan={locationType === "radius" ? 9 : 8} className="py-10 text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0064cb]" />
                              <span className="text-xs text-slate-500 font-medium mt-2 block">Loading guards...</span>
                            </TableCell>
                          </TableRow>
                        ) : allGuards.length > 0 ? (
                          allGuards.map((guard, index) => (
                            <TableRow
                              key={guard.guard_id || index}
                              className="border-slate-50 hover:bg-slate-50/40 transition-colors"
                            >
                              <TableCell className="py-2.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                                  checked={selectedGuardIds.includes(guard.guard_id)}
                                  onChange={(e) => handleSelectGuard(guard.guard_id, e.target.checked)}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 py-2.5 px-3 text-center">
                                {(currentPage - 1) * (pagination?.limit || 10) + index + 1}
                              </TableCell>
                              <TableCell className="text-[13px] font-bold text-slate-900 py-2.5 px-4">
                                {guard.first_name || ""} {guard.last_name || ""}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 py-2.5 px-4">{guard.email || "-"}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-2.5 px-4">
                                {getCityState(guard, index)}
                              </TableCell>
                              {locationType === "radius" && (
                                <TableCell className="text-xs font-medium text-slate-700 py-2.5 px-4">
                                  {getDistance(guard)}
                                </TableCell>
                              )}
                              <TableCell className="py-2.5 px-4 text-center text-xs text-slate-700">
                                {guard.armed ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-center text-xs text-slate-700">
                                {guard.unarmed ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-center">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize",
                                  guard.account_status === "inactive" || guard.status === false
                                    ? "bg-red-50 text-red-600 border border-red-100/60"
                                    : "bg-emerald-50 text-emerald-600 border border-emerald-100/60"
                                )}>
                                  {guard.account_status || (guard.status !== false ? "Active" : "Inactive")}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={locationType === "radius" ? 9 : 8} className="py-8 text-center text-slate-600 font-medium text-xs">
                              No guards found matching filters. Try adjusting your location or radius.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs font-bold text-slate-800">
                    {selectedGuardIds.length} guards selected
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveStep(0);
                        resetFilters();
                      }}
                      className="px-5 h-9 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      onClick={handleFind}
                      disabled={isFinding || selectedGuardIds.length === 0}
                      className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-5 h-9 rounded-lg text-xs font-bold shadow-md shadow-[#0064cb]/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isFinding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Send Job Opportunity ({selectedGuardIds.length})
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeStep === 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 w-full">
                <Button
                  onClick={() => {
                    if (selectedShiftIds.length === 0) {
                      toast.error("Please select shifts first");
                    } else {
                      setActiveStep(2);
                    }
                  }}
                  className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-11 rounded-lg font-bold shadow-lg shadow-[#0064cb]/20 transition-all cursor-pointer w-full sm:w-auto flex justify-center items-center"
                >
                  Go to Step 2
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
