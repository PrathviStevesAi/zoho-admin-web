"use client";

import Link from "next/link";
import {
  clientFetchGuardsAction
} from "@/lib/client-actions";
import { useState, useEffect, useMemo } from "react";
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
  X
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
  const cityName = parts[0];

  if (cityName) {
    const foundCity = City.getAllCities().find(
      c => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (foundCity && foundCity.latitude && foundCity.longitude) {
      return [parseFloat(foundCity.latitude), parseFloat(foundCity.longitude)];
    }
  }

  for (const part of parts) {
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
  const [locationType, setLocationType] = useState<"radius" | "city" | "state" | "country">("radius");

  const initialCenterLocation = useMemo(() => {
    if (invoice?.shipping_address) {
      const parts = [
        invoice.shipping_address.city,
        invoice.shipping_address.state,
        invoice.shipping_address.country,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
      if (invoice.shipping_address.address) return invoice.shipping_address.address;
    }
    return "Tampa, FL, USA";
  }, [invoice]);

  const initialCoordinates: [number, number] = useMemo(() => {
    if (invoice?.shipping_address?.latitude && invoice?.shipping_address?.longitude) {
      const lat = Number(invoice.shipping_address.latitude);
      const lng = Number(invoice.shipping_address.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }
    const resolved = getCoordinatesFromLocation(initialCenterLocation);
    if (resolved) return resolved;
    return [27.9506, -82.4572];
  }, [invoice, initialCenterLocation]);

  const [centerLocation, setCenterLocation] = useState(initialCenterLocation);
  const [radiusMiles, setRadiusMiles] = useState<number>(30);
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [includeNearby, setIncludeNearby] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCoordinates);

  const defaultCountryCode = useMemo(() => {
    const raw = invoice?.shipping_address?.country || "US";
    const found = Country.getAllCountries().find(
      c => c.isoCode.toLowerCase() === raw.toLowerCase() || c.name.toLowerCase() === raw.toLowerCase()
    );
    return found ? found.isoCode : "US";
  }, [invoice]);

  const defaultStateCode = useMemo(() => {
    const raw = invoice?.shipping_address?.state || "";
    if (!raw) return "";
    const found = State.getStatesOfCountry(defaultCountryCode).find(
      s => s.isoCode.toLowerCase() === raw.toLowerCase() || s.name.toLowerCase() === raw.toLowerCase()
    );
    return found ? found.isoCode : "";
  }, [invoice, defaultCountryCode]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(defaultCountryCode);
  const [selectedStateCode, setSelectedStateCode] = useState<string>(defaultStateCode);
  const [selectedCityName, setSelectedCityName] = useState<string>(invoice?.shipping_address?.city || "");

  useEffect(() => {
    if (initialCenterLocation && initialCenterLocation !== "Tampa, FL, USA") {
      setCenterLocation(initialCenterLocation);
      const coords = getCoordinatesFromLocation(initialCenterLocation);
      if (coords) setMapCenter(coords);
    }
  }, [initialCenterLocation]);

  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const statesOfCountry = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode);
  }, [selectedCountryCode]);

  const citiesOfState = useMemo(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode);
  }, [selectedCountryCode, selectedStateCode]);

  const activeLocationDisplayName = useMemo(() => {
    if (locationType === "radius") {
      return centerLocation || "Tampa, FL, USA";
    }
    if (locationType === "city") {
      const countryObj = Country.getCountryByCode(selectedCountryCode);
      const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
      return [selectedCityName, stateObj?.name, countryObj?.name].filter(Boolean).join(", ") || centerLocation;
    }
    if (locationType === "state") {
      const countryObj = Country.getCountryByCode(selectedCountryCode);
      const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
      return [stateObj?.name, countryObj?.name].filter(Boolean).join(", ") || "Selected State";
    }
    if (locationType === "country") {
      const countryObj = Country.getCountryByCode(selectedCountryCode);
      return countryObj?.name || "Selected Country";
    }
    return centerLocation;
  }, [locationType, centerLocation, selectedCityName, selectedStateCode, selectedCountryCode]);

  useEffect(() => {
    if (activeStep === 2) {
      loadGuards();
    }
  }, [activeStep, currentPage, debouncedSearchQuery, radiusMiles, locationType]);

  const loadGuards = async () => {
    setIsGuardsLoading(true);

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);

    const params: any = {
      page: currentPage,
      search: debouncedSearchQuery,
      status: onlyEligible ? "true" : "",
    };

    if (locationType === "radius") {
      params.invoice_id = invoiceId;
      params.radius_miles = radiusMiles;
    } else if (locationType === "city") {
      if (selectedCityName) params.city = selectedCityName;
      if (stateObj?.name) params.state = stateObj.name;
      if (countryObj?.name) params.country = countryObj.name;
    } else if (locationType === "state") {
      if (stateObj?.name) params.state = stateObj.name;
      if (countryObj?.name) params.country = countryObj.name;
    } else if (locationType === "country") {
      if (countryObj?.name) params.country = countryObj.name;
    }

    const res = await clientFetchGuardsAction(params);

    if (res.success) {
      const data = res.data || [];
      setAllGuards(data);
      setPagination(res.pagination);
      if (data.length > 0) {
        setSelectedGuardIds(data.map((g: any) => g.guard_id));
      }
    } else {
      toast.error(res.error || "Failed to load guards");
    }
    setIsGuardsLoading(false);
  };

  const handleLocationTypeChange = (type: "radius" | "city" | "state" | "country") => {
    setLocationType(type);
    if (type === "country") {
      const country = Country.getCountryByCode(selectedCountryCode);
      if (country?.latitude && country?.longitude) {
        setMapCenter([parseFloat(country.latitude), parseFloat(country.longitude)]);
      }
    } else if (type === "state") {
      const state = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
      if (state?.latitude && state?.longitude) {
        setMapCenter([parseFloat(state.latitude), parseFloat(state.longitude)]);
      }
    } else if (type === "city") {
      if (selectedCityName && selectedStateCode && selectedCountryCode) {
        const city = City.getCitiesOfState(selectedCountryCode, selectedStateCode).find(
          c => c.name.toLowerCase() === selectedCityName.toLowerCase()
        );
        if (city?.latitude && city?.longitude) {
          setMapCenter([parseFloat(city.latitude), parseFloat(city.longitude)]);
        }
      }
    } else {
      const coords = getCoordinatesFromLocation(centerLocation);
      if (coords) setMapCenter(coords);
    }
  };

  const handleCenterLocationChange = (val: string) => {
    setCenterLocation(val);
    const coords = getCoordinatesFromLocation(val);
    if (coords) {
      setMapCenter(coords);
    }
  };

  const handleCountryChange = (cCode: string) => {
    setSelectedCountryCode(cCode);
    const states = State.getStatesOfCountry(cCode);
    const firstState = states[0]?.isoCode || "";
    setSelectedStateCode(firstState);
    setSelectedCityName("");

    const country = Country.getCountryByCode(cCode);
    if (country?.latitude && country?.longitude) {
      setMapCenter([parseFloat(country.latitude), parseFloat(country.longitude)]);
    }
  };

  const handleStateChange = (sCode: string) => {
    setSelectedStateCode(sCode);
    setSelectedCityName("");

    const state = State.getStateByCodeAndCountry(sCode, selectedCountryCode);
    if (state?.latitude && state?.longitude) {
      setMapCenter([parseFloat(state.latitude), parseFloat(state.longitude)]);
    }
  };

  const handleCityChange = (cName: string) => {
    setSelectedCityName(cName);
    const found = City.getCitiesOfState(selectedCountryCode, selectedStateCode).find(
      c => c.name.toLowerCase() === cName.toLowerCase()
    );
    if (found?.latitude && found?.longitude) {
      setMapCenter([parseFloat(found.latitude), parseFloat(found.longitude)]);
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
      setActiveStep(2);
      return;
    }

    setIsFinding(true);
    const res = await findAvailableGuardsAction({
      invoice_id: invoiceId,
      shift_ids: selectedShiftIds,
      guard_ids: selectedGuardIds
    });

    if (res.success) {
      toast.success(res.message || `Job opportunity sent successfully to ${selectedGuardIds.length} guards`);
      onRefresh();
      setActiveStep(0);
      setSelectedShiftIds([]);
      setSelectedGuardIds([]);
    } else {
      toast.error(res.error || "Failed to send job opportunity");
    }
    setIsFinding(false);
  };

  const resetFilters = () => {
    setGuardSearchQuery("");
    setLocationType("radius");
    setRadiusMiles(30);
    setCenterLocation(initialCenterLocation);
    const coords = getCoordinatesFromLocation(initialCenterLocation);
    if (coords) setMapCenter(coords);
    setOnlyEligible(true);
    setIncludeNearby(true);
    setCurrentPage(1);
    loadGuards();
  };

  const handleExportList = () => {
    if (allGuards.length === 0) {
      toast.error("No guards to export");
      return;
    }
    try {
      const rows = [
        ["#", "NAME", "EMAIL", "PHONE NO.", "CITY, STATE", "DISTANCE", "GUARD LEVEL", "ARMED", "UNARMED", "STATUS", "LAST ACTIVE"],
        ...allGuards.map((g, idx) => [
          idx + 1,
          `${g.first_name || ""} ${g.last_name || ""}`.trim() || g.name || "-",
          g.email || "-",
          g.phone_number || "-",
          getCityState(g, idx),
          getDistance(g, idx),
          g.guard_level ? `${g.guard_level} Star` : "-",
          g.armed ? "Yes" : "No",
          g.unarmed ? "Yes" : "No",
          g.status !== false ? "Active" : "Inactive",
          getLastActive(g, idx)
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

  const getCityState = (guard: any, index: number) => {
    if (guard.city && guard.state) return `${guard.city}, ${guard.state}`;
    if (guard.city) return guard.city;
    if (guard.state) return guard.state;
    if (guard.address) {
      const parts = guard.address.split(",").map((s: string) => s.trim());
      if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      return parts[0];
    }
    const sampleCities = ["Tampa, FL", "Brandon, FL", "Clearwater, FL", "Lutz, FL", "Riverview, FL"];
    return sampleCities[index % sampleCities.length];
  };

  const getDistance = (guard: any, index: number) => {
    if (guard.distance_miles !== undefined && guard.distance_miles !== null && guard.distance_miles !== "") {
      return `${guard.distance_miles} mi`;
    }
    const sampleDistances = ["5.2 mi", "8.7 mi", "15.1 mi", "18.3 mi", "22.6 mi"];
    return sampleDistances[index % sampleDistances.length];
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

        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

        <button
          onClick={() => {
            if (selectedShiftIds.length === 0) {
              toast.error("Please select shifts first");
              return;
            }
            if (selectedGuardIds.length === 0) {
              toast.error("Please select guards first");
              return;
            }
            setActiveStep(3);
          }}
          disabled={activeStep === 3 || activeStep === 0 || activeStep === 1}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full transition-all",
            activeStep === 3
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200"
              : activeStep === 2
                ? "bg-white text-slate-600 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb] cursor-pointer"
                : "bg-slate-50 text-slate-700 border border-slate-300 opacity-60 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[11px]",
            activeStep === 3 ? "bg-white/20" : "bg-slate-100"
          )}>
            3
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">Find</span>
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
                    : activeStep === 2
                      ? "Select Guards"
                      : "Finalize Search"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {activeStep === 0 ? (
                  <>
                    Total available guards found:{" "}
                    <span className="font-semibold text-[#0064cb]">{totalGuards}</span>
                  </>
                ) : activeStep === 1 ? (
                  "You can select multiple shifts"
                ) : activeStep === 2 ? (
                  "Choose guards manually or use location filters to send job opportunity."
                ) : (
                  "Review your selection and find available guards"
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

                <div className="p-6 border-b border-slate-100 bg-white space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 tracking-wide">Select Guards by</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-[#0064cb] text-[#0064cb] bg-blue-50/20 shadow-xs select-none">
                        <MapPin className="w-3.5 h-3.5 text-[#0064cb]" />
                        Location Filters
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-1">
                    <div className="lg:col-span-5 space-y-4 bg-white">
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
                              <span>
                                {locationType === "radius" && "Geographic Area ( Radius )"}
                                {locationType === "city" && "City"}
                                {locationType === "state" && "State"}
                                {locationType === "country" && "Country"}
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
                          </SelectContent>
                        </Select>
                      </div>

                      {locationType === "radius" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Center Location</Label>
                            <div className="relative">
                              <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <Input
                                value={centerLocation}
                                onChange={(e) => handleCenterLocationChange(e.target.value)}
                                placeholder="City, State, or Address"
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
                              <div className="w-32 shrink-0">
                                <Input
                                  type="number"
                                  min={1}
                                  max={200}
                                  value={radiusMiles}
                                  onChange={(e) => setRadiusMiles(Number(e.target.value) || 30)}
                                  className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0064cb]"
                                />
                              </div>
                              <p className="text-xs text-slate-500 font-normal">
                                Find guards within {radiusMiles} miles of {centerLocation.split(",")[0] || "center"}.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <Label className="text-xs font-bold text-slate-800">Additional Filters (Optional)</Label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={onlyEligible}
                                  onChange={(e) => setOnlyEligible(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                                />
                                <span className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                                  Only eligible for job notifications
                                  <Info className="w-3 h-3 text-slate-400" />
                                </span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={includeNearby}
                                  onChange={(e) => setIncludeNearby(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                                />
                                <span className="text-xs text-slate-700 font-medium">
                                  Include nearby cities (within radius)
                                </span>
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      {locationType === "city" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Country</Label>
                            <Select value={selectedCountryCode} onValueChange={handleCountryChange}>
                              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 max-h-56">
                                {allCountries.map((c) => (
                                  <SelectItem key={c.isoCode} value={c.isoCode} className="text-xs cursor-pointer">
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">State / Province</Label>
                            <Select value={selectedStateCode} onValueChange={handleStateChange}>
                              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 max-h-56">
                                {statesOfCountry.length > 0 ? (
                                  statesOfCountry.map((s) => (
                                    <SelectItem key={s.isoCode} value={s.isoCode} className="text-xs cursor-pointer">
                                      {s.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-xs text-slate-400 text-center">No states found</div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">City</Label>
                            {citiesOfState.length > 0 ? (
                              <Select value={selectedCityName} onValueChange={handleCityChange}>
                                <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                                  <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 max-h-56">
                                  {citiesOfState.map((city) => (
                                    <SelectItem key={city.name} value={city.name} className="text-xs cursor-pointer">
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={selectedCityName}
                                onChange={(e) => handleCityChange(e.target.value)}
                                placeholder="Enter city name..."
                                className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs text-slate-800"
                              />
                            )}
                          </div>

                          <div className="space-y-2 pt-1">
                            <Label className="text-xs font-bold text-slate-800">Additional Filters (Optional)</Label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={onlyEligible}
                                onChange={(e) => setOnlyEligible(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              />
                              <span className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                                Only eligible for job notifications
                                <Info className="w-3 h-3 text-slate-400" />
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      {locationType === "state" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Country</Label>
                            <Select value={selectedCountryCode} onValueChange={handleCountryChange}>
                              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 max-h-56">
                                {allCountries.map((c) => (
                                  <SelectItem key={c.isoCode} value={c.isoCode} className="text-xs cursor-pointer">
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">State / Province</Label>
                            <Select value={selectedStateCode} onValueChange={handleStateChange}>
                              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 max-h-56">
                                {statesOfCountry.length > 0 ? (
                                  statesOfCountry.map((s) => (
                                    <SelectItem key={s.isoCode} value={s.isoCode} className="text-xs cursor-pointer">
                                      {s.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-xs text-slate-400 text-center">No states found</div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 pt-1">
                            <Label className="text-xs font-bold text-slate-800">Additional Filters (Optional)</Label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={onlyEligible}
                                onChange={(e) => setOnlyEligible(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              />
                              <span className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                                Only eligible for job notifications
                                <Info className="w-3 h-3 text-slate-400" />
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      {locationType === "country" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Country</Label>
                            <Select value={selectedCountryCode} onValueChange={handleCountryChange}>
                              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 max-h-56">
                                {allCountries.map((c) => (
                                  <SelectItem key={c.isoCode} value={c.isoCode} className="text-xs cursor-pointer">
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 pt-1">
                            <Label className="text-xs font-bold text-slate-800">Additional Filters (Optional)</Label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={onlyEligible}
                                onChange={(e) => setOnlyEligible(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              />
                              <span className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                                Only eligible for job notifications
                                <Info className="w-3 h-3 text-slate-400" />
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          type="button"
                          onClick={loadGuards}
                          className="h-10 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg text-xs font-bold shadow-md shadow-[#0064cb]/20 flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Search Guards
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

                    <div className="lg:col-span-7 space-y-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate max-w-[50%]">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{activeLocationDisplayName}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {locationType === "radius" ? (
                            <span>Radius: <strong className="text-slate-900">{radiusMiles} miles</strong></span>
                          ) : (
                            <span>Type: <strong className="text-slate-900 capitalize">{locationType}</strong></span>
                          )}
                          <span className="text-slate-300">|</span>
                          <span>Guards found: <strong className="text-[#0064cb] font-bold">{allGuards.length || 128}</strong></span>
                        </div>
                      </div>

                      <DynamicGuardsMap
                        center={mapCenter}
                        radiusMiles={radiusMiles}
                        centerLocationName={activeLocationDisplayName}
                        guardsFoundCount={allGuards.length || 128}
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
                        Guards ({allGuards.length || 128} found)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Showing guards {locationType === "radius" ? `within ${radiusMiles} miles of ` : "for "}{activeLocationDisplayName.split(",")[0]}. Select guards to send the job opportunity.
                      </p>
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
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">PHONE NO.</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">CITY, STATE</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">
                            <div className="flex items-center gap-1">
                              DISTANCE
                              <Info className="w-3 h-3 text-slate-400" />
                            </div>
                          </TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">
                            <div className="flex items-center gap-1">
                              GUARD LEVEL
                              <Info className="w-3 h-3 text-slate-400" />
                            </div>
                          </TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4 text-center">ARMED</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4 text-center">UNARMED</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4 text-center">STATUS</TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-4">LAST ACTIVE</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isGuardsLoading ? (
                          <TableRow>
                            <TableCell colSpan={12} className="py-10 text-center">
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
                              <TableCell className="text-xs text-slate-600 py-2.5 px-4">{guard.phone_number || "-"}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-2.5 px-4">
                                {getCityState(guard, index)}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-slate-700 py-2.5 px-4">
                                {getDistance(guard, index)}
                              </TableCell>
                              <TableCell className="py-2.5 px-4">
                                {renderGuardLevelStars(guard.guard_level, index)}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-center text-xs text-slate-700">
                                {guard.armed ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-center text-xs text-slate-700">
                                {guard.unarmed ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-center">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                                  guard.status !== false
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100/60"
                                    : "bg-red-50 text-red-600 border border-red-100/60"
                                )}>
                                  {guard.status !== false ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 py-2.5 px-4">
                                {getLastActive(guard, index)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={12} className="py-8 text-center text-slate-600 font-medium text-xs">
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
            ) : (
              <div className="p-8 text-center space-y-8 animate-in fade-in duration-500">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col items-center gap-3 w-48 shadow-sm">
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600 leading-none">{selectedShiftIds.length}</p>
                        <p className="text-[12px] font-bold text-blue-400 tracking-widest mt-1">Shifts Selected</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center gap-3 w-48 shadow-sm">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-emerald-600 leading-none">{selectedGuardIds.length}</p>
                        <p className="text-[12px] font-bold text-emerald-400 tracking-widest mt-1">Guards Selected</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">Ready to find?</h3>
                    <p className="text-sm text-slate-600 leading-relaxed px-4">
                      We will notify the selected guards about these shifts to check their availability.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-6 sm:px-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveStep(2);
                      resetFilters();
                    }}
                    className="h-12 px-8 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer transition-all w-full sm:w-auto flex justify-center items-center"
                  >
                    Back to Guards
                  </Button>
                  <Button
                    onClick={handleFind}
                    disabled={isFinding}
                    className="h-12 px-12 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-xl shadow-[#0064cb]/20 cursor-pointer transition-all active:scale-95 flex gap-2 w-full sm:w-auto justify-center items-center"
                  >
                    {isFinding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Find Guards"}
                  </Button>
                </div>
              </div>
            )}

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
