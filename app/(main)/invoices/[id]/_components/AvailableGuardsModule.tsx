"use client";

import Link from "next/link";
import {
  clientFetchGuardsNewAction,
  clientFetchLocationAction,
  clientFetchAvailableGuardsShiftsAction,
  clientFetchAvailableGuardsMatrixAction,
  clientFetchInvoiceShiftsAction,
  AvailableGuardItem,
  FetchGuardsByLocationParams
} from "@/lib/client-actions";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  UserCheck,
  Info,
  ArrowLeft,
  Smartphone,
  MessageSquare,
  MapPin,
  Globe,
  Building2,
  Map,
  Search,
  Send,
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CalendarDays,
  Users,
  Check,
  Clock,
  Plane,
  Minus
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { findAvailableGuardsAction } from "@/actions/dashboard.actions";
import { DynamicGuardsMap } from "./DynamicGuardsMap";
import Autocomplete from "react-google-autocomplete";

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

const MATRIX_AVATAR_COLORS: { [key: string]: string } = {
  "HC": "bg-indigo-100 text-indigo-700",
  "JT": "bg-purple-100 text-purple-700",
  "RW": "bg-blue-100 text-blue-700",
  "SB": "bg-rose-100 text-rose-700",
  "MC": "bg-sky-100 text-sky-700",
  "DG": "bg-violet-100 text-violet-700",
  "SL": "bg-indigo-100 text-indigo-700",
  "RJ": "bg-blue-100 text-blue-700",
};

function getMatrixInitials(name: string): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatShiftDisplayDate(dateStr?: string): string {
  if (!dateStr) return "Oct 10, 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatShiftDisplayTime(startStr?: string, endStr?: string): string {
  if (!startStr && !endStr) return "08:00 AM - 04:00 PM";
  try {
    const fmt = (s?: string) => {
      if (!s) return "";
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };
    if (startStr && endStr) {
      return `${fmt(startStr)} - ${fmt(endStr)}`;
    }
    return fmt(startStr || endStr);
  } catch {
    return "08:00 AM - 04:00 PM";
  }
}

type MatrixShiftStatus = "available" | "unavailable" | "not_available" | "pending" | "willing_to_travel" | "not_sent" | string;

function MatrixStatusBadge({ status }: { status: MatrixShiftStatus }) {
  const norm = String(status || "").toLowerCase().trim();
  switch (norm) {
    case "available":
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto" title="Available">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    case "unavailable":
    case "not_available":
      return (
        <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto" title="Unavailable">
          <X className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    case "pending":
      return (
        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto" title="Pending">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      );
    case "willing_to_travel":
      return (
        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto" title="Willing to Travel">
          <Plane className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      );
    case "not_sent":
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto" title="Not Sent">
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
  }
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [notificationSource, setNotificationSource] = useState<"in_app" | "sms" | "both">("in_app");
  const [locationType, setLocationType] = useState<"radius" | "city" | "state" | "country" | "all_guard" | "all">("radius");
  const [serviceFilter, setServiceFilter] = useState<"all" | "both" | "armed" | "unarmed">("all");

  const [sentShifts, setSentShifts] = useState<any[]>([]);
  const [isSentShiftsLoading, setIsSentShiftsLoading] = useState(false);

  const fetchSentShifts = useCallback(async () => {
    if (!invoiceId) return;
    setIsSentShiftsLoading(true);
    try {
      const res = await clientFetchAvailableGuardsShiftsAction(invoiceId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setSentShifts(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch available guards sent shifts:", err);
    } finally {
      setIsSentShiftsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchSentShifts();
  }, [fetchSentShifts]);

  const [step1Shifts, setStep1Shifts] = useState<any[]>([]);
  const [isStep1ShiftsLoading, setIsStep1ShiftsLoading] = useState(false);

  const loadStep1Shifts = useCallback(async () => {
    if (!invoiceId) return;
    setIsStep1ShiftsLoading(true);
    try {
      const res = await clientFetchInvoiceShiftsAction(invoiceId, "assign_guard");
      if (res.success && Array.isArray(res.data)) {
        setStep1Shifts(res.data);
      } else {
        toast.error(res.error || "Failed to load shifts");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load shifts");
    } finally {
      setIsStep1ShiftsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (activeStep === 1) {
      loadStep1Shifts();
    }
  }, [activeStep, loadStep1Shifts]);

  const cleanShiftNo = useCallback((no: any) => {
    return String(no || "").replace(/^#/, "").trim();
  }, []);

  const findRealShiftId = useCallback((shiftOrNoOrId: any): string => {
    if (!shiftOrNoOrId) return "";
    const strVal = typeof shiftOrNoOrId === "object"
      ? String(shiftOrNoOrId.shift_id || shiftOrNoOrId.id || "")
      : String(shiftOrNoOrId);
    const targetNo = typeof shiftOrNoOrId === "object"
      ? cleanShiftNo(shiftOrNoOrId.shift_no || shiftOrNoOrId.shift_number)
      : cleanShiftNo(shiftOrNoOrId);

    const shiftList = step1Shifts.length > 0 ? step1Shifts : shifts;

    if (Array.isArray(shiftList) && shiftList.length > 0) {
      // 1. Match by shift_id / id
      const matchById = shiftList.find((s: any) =>
        (s.shift_id && s.shift_id === strVal) || (s.id && s.id === strVal)
      );
      if (matchById && (matchById.shift_id || matchById.id)) {
        return String(matchById.shift_id || matchById.id);
      }

      // 2. Match by shift_no
      if (targetNo) {
        const matchByNo = shiftList.find((s: any) =>
          cleanShiftNo(s.shift_no || s.shift_number) === targetNo
        );
        if (matchByNo && (matchByNo.shift_id || matchByNo.id)) {
          return String(matchByNo.shift_id || matchByNo.id);
        }
      }

      // 3. Match against strVal if strVal happened to be raw shift_no without '#'
      const matchByStrNo = shiftList.find((s: any) =>
        cleanShiftNo(s.shift_no || s.shift_number) === cleanShiftNo(strVal)
      );
      if (matchByStrNo && (matchByStrNo.shift_id || matchByStrNo.id)) {
        return String(matchByStrNo.shift_id || matchByStrNo.id);
      }
    }

    return strVal;
  }, [step1Shifts, shifts, cleanShiftNo]);

  const availableInvoiceShifts = useMemo(() => {
    const rawList =
      Array.isArray(sentShifts) && sentShifts.length > 0
        ? sentShifts
        : Array.isArray(shifts) && shifts.length > 0
          ? shifts
          : [];

    if (rawList.length > 0) {
      const seen = new Set<string>();
      const uniqueShifts: Array<{
        shift_id: string;
        shift_no: string;
        start_time: string;
        end_time: string;
      }> = [];

      rawList.forEach((s: any, idx: number) => {
        const rawNo = cleanShiftNo(s.shift_no || s.shift_number || `${idx + 101}`);
        const formattedNo = `#${rawNo}`;

        const matched = (step1Shifts.length > 0 ? step1Shifts : shifts)?.find((invShift: any) => {
          if (s.shift_id && (invShift.shift_id === s.shift_id || invShift.id === s.shift_id)) return true;
          if (s.id && (invShift.shift_id === s.id || invShift.id === s.id)) return true;
          const invNo = cleanShiftNo(invShift.shift_no || invShift.shift_number);
          return invNo && rawNo && invNo === rawNo;
        });

        const trueId = String(
          matched?.shift_id ||
          matched?.id ||
          s.shift_id ||
          s.id ||
          rawNo ||
          `shift-${idx}`
        );

        if (!seen.has(rawNo)) {
          seen.add(rawNo);
          uniqueShifts.push({
            shift_id: trueId,
            shift_no: formattedNo,
            start_time: s.start_time || matched?.start_time || "2026-10-10T08:00:00",
            end_time: s.end_time || matched?.end_time || "2026-10-10T16:00:00",
          });
        }
      });
      return uniqueShifts;
    }
    return [];
  }, [sentShifts, shifts, step1Shifts, cleanShiftNo]);

  const [selectedMatrixShiftIds, setSelectedMatrixShiftIds] = useState<string[]>([]);

  useEffect(() => {
    if (availableInvoiceShifts.length > 0) {
      setSelectedMatrixShiftIds((prev) => {
        const valid = prev.filter((id) => availableInvoiceShifts.some((s) => s.shift_id === id));
        if (valid.length > 0) {
          return valid;
        }
        return [availableInvoiceShifts[0].shift_id];
      });
    } else {
      setSelectedMatrixShiftIds([]);
    }
  }, [availableInvoiceShifts]);

  const [matrixAvailabilityType, setMatrixAvailabilityType] = useState<
    "all" | "available_all" | "available_any" | "willing_to_travel_all" | "willing_to_travel_any"
  >("all");
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const shiftDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(event.target as Node)) {
        setIsShiftDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [matrixGuards, setMatrixGuards] = useState<AvailableGuardItem[]>([]);
  const [matrixShiftNos, setMatrixShiftNos] = useState<string[]>([]);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  const [hasMatrixSearched, setHasMatrixSearched] = useState(false);
  const [matrixTotalGuards, setMatrixTotalGuards] = useState(0);
  const [matrixTotalPages, setMatrixTotalPages] = useState(1);
  const [matrixCurrentPage, setMatrixCurrentPage] = useState(1);

  const selectedMatrixShifts = useMemo(() => {
    const seen = new Set<string>();
    return availableInvoiceShifts.filter((s) => {
      if (selectedMatrixShiftIds.includes(s.shift_id) && !seen.has(s.shift_id)) {
        seen.add(s.shift_id);
        return true;
      }
      return false;
    });
  }, [availableInvoiceShifts, selectedMatrixShiftIds]);

  const handleToggleMatrixShift = (id: string) => {
    setSelectedMatrixShiftIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toast.info("At least one shift must be selected");
          return prev;
        }
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  const handleRemoveMatrixShift = (id: string) => {
    setSelectedMatrixShiftIds((prev) => {
      if (prev.length <= 1) {
        toast.info("At least one shift must be selected");
        return prev;
      }
      return prev.filter((i) => i !== id);
    });
  };

  const fetchAvailableGuardsMatrix = async (pageToFetch: number = 1) => {
    if (!invoiceId) return;
    setIsMatrixLoading(true);
    setHasMatrixSearched(true);
    try {
      const shiftNosToSend = selectedMatrixShifts.map((s) =>
        String(s.shift_no).replace(/^#/, "").trim()
      );
      const res = await clientFetchAvailableGuardsMatrixAction(
        invoiceId,
        shiftNosToSend,
        matrixAvailabilityType,
        pageToFetch
      );
      if (res.success && res.data) {
        setMatrixGuards(res.data);
        if (Array.isArray(res.shift_nos) && res.shift_nos.length > 0) {
          setMatrixShiftNos(res.shift_nos);
        } else {
          setMatrixShiftNos(shiftNosToSend);
        }
        setMatrixTotalGuards(res.total_guards ?? res.data.length);
        setMatrixTotalPages(res.total_pages ?? 1);
        setMatrixCurrentPage(res.current_page ?? pageToFetch);
      }
    } catch (err) {
      console.error("Failed to fetch available guards matrix:", err);
    } finally {
      setIsMatrixLoading(false);
    }
  };

  const displayedShiftNos = useMemo(() => {
    if (matrixShiftNos && matrixShiftNos.length > 0) {
      return matrixShiftNos;
    }
    return selectedMatrixShifts.map((s) => String(s.shift_no).replace(/^#/, "").trim());
  }, [matrixShiftNos, selectedMatrixShifts]);

  const dynamicSiteLocation = useMemo(() => {
    if (Array.isArray(invoice?.history)) {
      for (const h of invoice.history) {
        let details = h?.details;
        if (typeof details === "string") {
          try {
            details = JSON.parse(details);
          } catch { }
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

    if (invoice?.site_location) return String(invoice.site_location).trim();
    if (invoice?.location) return String(invoice.location).trim();
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

  const initialCoordinates: [number, number] = useMemo(() => {
    if (invoice?.latitude !== undefined && invoice?.latitude !== null && invoice?.longitude !== undefined && invoice?.longitude !== null) {
      const lat = Number(invoice.latitude);
      const lng = Number(invoice.longitude);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return [lat, lng];
      }
    }
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
    if (activeStep === 2 && (locationType === "city" || locationType === "state" || locationType === "country")) {
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
    }
  }, [activeStep, locationType]);

  const invoiceLocation = useMemo(() => {
    let city = invoice?.city ? String(invoice.city).trim() : "";
    let state = invoice?.state ? String(invoice.state).trim() : "";
    let country = invoice?.country ? String(invoice.country).trim() : "";

    let shipping = invoice?.shipping_address;
    if (typeof shipping === "string") {
      try {
        shipping = JSON.parse(shipping);
      } catch { }
    }
    if (shipping && typeof shipping === "object") {
      if (!city && shipping.city) city = String(shipping.city).trim();
      if (!state && shipping.state) state = String(shipping.state).trim();
      if (!country && shipping.country) country = String(shipping.country).trim();
    }

    let serviceAddr = invoice?.service_address;
    if (typeof serviceAddr === "string") {
      try {
        serviceAddr = JSON.parse(serviceAddr);
      } catch { }
    }
    if (serviceAddr && typeof serviceAddr === "object") {
      if (!city && serviceAddr.city) city = String(serviceAddr.city).trim();
      if (!state && serviceAddr.state) state = String(serviceAddr.state).trim();
      if (!country && serviceAddr.country) country = String(serviceAddr.country).trim();
    }

    if ((!city || !state || !country) && dynamicSiteLocation && dynamicSiteLocation !== "Site Location") {
      const parts = dynamicSiteLocation.split(",").map((p: string) => p.trim());
      if (parts.length >= 3) {
        if (!country) {
          const lastPart = parts[parts.length - 1];
          const cName = lastPart.split("-")[0].trim();
          if (cName) country = cName;
        }
        if (!state && parts.length >= 2) {
          state = parts[parts.length - 2].trim();
        }
        if (!city && parts.length >= 3) {
          city = parts[parts.length - 3].trim();
        }
      }
    }

    return { city, state, country };
  }, [invoice, dynamicSiteLocation]);

  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    let city = invoice?.city ? String(invoice.city).trim() : "";
    let shipping = invoice?.shipping_address;
    if (typeof shipping === "string") {
      try { shipping = JSON.parse(shipping); } catch { }
    }
    if (shipping && typeof shipping === "object" && shipping.city) {
      city = String(shipping.city).trim();
    }
    return city ? [city] : [];
  });

  const [selectedStates, setSelectedStates] = useState<string[]>(() => {
    let state = invoice?.state ? String(invoice.state).trim() : "";
    let shipping = invoice?.shipping_address;
    if (typeof shipping === "string") {
      try { shipping = JSON.parse(shipping); } catch { }
    }
    if (shipping && typeof shipping === "object" && shipping.state) {
      state = String(shipping.state).trim();
    }
    return state ? [state] : [];
  });

  const [selectedCountries, setSelectedCountries] = useState<string[]>(() => {
    let country = invoice?.country ? String(invoice.country).trim() : "";
    let shipping = invoice?.shipping_address;
    if (typeof shipping === "string") {
      try { shipping = JSON.parse(shipping); } catch { }
    }
    if (shipping && typeof shipping === "object" && shipping.country) {
      country = String(shipping.country).trim();
    }
    return country ? [country] : [];
  });

  const [citySelectKey, setCitySelectKey] = useState(0);
  const [stateSelectKey, setStateSelectKey] = useState(0);
  const [countrySelectKey, setCountrySelectKey] = useState(0);

  useEffect(() => {
    if (invoiceLocation.city) {
      setSelectedCities((prev) => (prev.length === 0 ? [invoiceLocation.city] : prev));
    }
  }, [invoiceLocation.city]);

  useEffect(() => {
    if (invoiceLocation.state) {
      setSelectedStates((prev) => (prev.length === 0 ? [invoiceLocation.state] : prev));
    }
  }, [invoiceLocation.state]);

  useEffect(() => {
    if (invoiceLocation.country) {
      setSelectedCountries((prev) => (prev.length === 0 ? [invoiceLocation.country] : prev));
    }
  }, [invoiceLocation.country]);

  const availableCities = useMemo(() => {
    const list = [...apiLocations.cities];
    if (invoiceLocation.city && !list.some((c) => c.trim().toLowerCase() === invoiceLocation.city.trim().toLowerCase())) {
      list.unshift(invoiceLocation.city);
    }
    return list;
  }, [apiLocations.cities, invoiceLocation.city]);

  const availableStates = useMemo(() => {
    const list = [...apiLocations.states];
    if (invoiceLocation.state && !list.some((s) => s.trim().toLowerCase() === invoiceLocation.state.trim().toLowerCase())) {
      list.unshift(invoiceLocation.state);
    }
    return list;
  }, [apiLocations.states, invoiceLocation.state]);

  const availableCountries = useMemo(() => {
    const list = [...apiLocations.countries];
    if (invoiceLocation.country && !list.some((c) => c.trim().toLowerCase() === invoiceLocation.country.trim().toLowerCase())) {
      list.unshift(invoiceLocation.country);
    }
    return list;
  }, [apiLocations.countries, invoiceLocation.country]);

  const handleAddCity = (cityName: string) => {
    if (!cityName) return;
    if (!selectedCities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
      setSelectedCities((prev) => [...prev, cityName]);
    }
  };

  const handleRemoveCity = (nameToRemove: string) => {
    setSelectedCities((prev) => prev.filter((c) => c.toLowerCase() !== nameToRemove.toLowerCase()));
  };

  const handleAddState = (stateName: string) => {
    if (!stateName) return;
    if (!selectedStates.some((s) => s.toLowerCase() === stateName.toLowerCase())) {
      setSelectedStates((prev) => [...prev, stateName]);
    }
  };

  const handleRemoveState = (nameToRemove: string) => {
    setSelectedStates((prev) => prev.filter((s) => s.toLowerCase() !== nameToRemove.toLowerCase()));
  };

  const handleAddCountry = (countryName: string) => {
    if (!countryName) return;
    if (!selectedCountries.some((c) => c.toLowerCase() === countryName.toLowerCase())) {
      setSelectedCountries((prev) => [...prev, countryName]);
    }
  };

  const handleRemoveCountry = (nameToRemove: string) => {
    setSelectedCountries((prev) => prev.filter((c) => c.toLowerCase() !== nameToRemove.toLowerCase()));
  };

  const isCustomRadiusLocation = useMemo(() => {
    if (locationType !== "radius") return false;
    if (!centerLocation || !centerLocation.trim()) return false;
    return centerLocation.trim().toLowerCase() !== dynamicSiteLocation.trim().toLowerCase();
  }, [locationType, centerLocation, dynamicSiteLocation]);

  const mapDisplayedLocation = useMemo(() => {
    if (locationType === "radius" && isCustomRadiusLocation && centerLocation) {
      return centerLocation;
    }
    return dynamicSiteLocation;
  }, [locationType, isCustomRadiusLocation, centerLocation, dynamicSiteLocation]);

  const activeLocationDisplayName = useMemo(() => {
    if (locationType === "radius" && centerLocation) {
      return centerLocation;
    }
    if (locationType === "all_guard" || locationType === "all") {
      return "All Guards";
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
      service: serviceFilter,
      page: null,
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
    } else if (locationType === "all_guard" || locationType === "all") {
      params.location_type = "all_guard";
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

  const handleLocationTypeChange = (type: "radius" | "city" | "state" | "country" | "all_guard" | "all") => {
    setLocationType(type);
    setMapCenter(initialCoordinates);
    if (type === "city") {
      const cityToUse = selectedCities.length > 0 ? selectedCities[0] : invoiceLocation.city;
      if (cityToUse && selectedCities.length === 0) {
        setSelectedCities([cityToUse]);
      }
    } else if (type === "state") {
      const stateToUse = selectedStates.length > 0 ? selectedStates[0] : invoiceLocation.state;
      if (stateToUse && selectedStates.length === 0) {
        setSelectedStates([stateToUse]);
      }
    } else if (type === "country") {
      const countryToUse = selectedCountries.length > 0 ? selectedCountries[0] : invoiceLocation.country;
      if (countryToUse && selectedCountries.length === 0) {
        setSelectedCountries([countryToUse]);
      }
    }
  };

  const handlePlaceSelect = (place: any) => {
    if (!place) return;
    const address = place.formatted_address || place.name || "";
    if (address) {
      setCenterLocation(address);
    }
    const lat = place.geometry?.location?.lat?.();
    const lng = place.geometry?.location?.lng?.();
    if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
    } else {
      const coords = getCoordinatesFromLocation(address);
      if (coords) {
        setMapCenter(coords);
      }
    }
  };

  const handleCenterLocationChange = (val: string) => {
    setCenterLocation(val);
    if (!val || val.trim().toLowerCase() === dynamicSiteLocation.trim().toLowerCase()) {
      setMapCenter(initialCoordinates);
    } else {
      const coords = getCoordinatesFromLocation(val);
      if (coords) {
        setMapCenter(coords);
      }
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
    const list = step1Shifts.length > 0 ? step1Shifts : shifts;
    if (checked) {
      setSelectedShiftIds(list.map(s => String(s.shift_id || s.id)));
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

    let currentShifts = step1Shifts.length > 0 ? step1Shifts : shifts;
    if ((!currentShifts || currentShifts.length === 0) && invoiceId) {
      try {
        const res = await clientFetchInvoiceShiftsAction(invoiceId, "assign_guard");
        if (res.success && Array.isArray(res.data)) {
          currentShifts = res.data;
          setStep1Shifts(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch shifts to resolve shift IDs:", e);
      }
    }

    // Resolve every shift ID to its actual UUID / shift_id
    const resolvedShiftIds = selectedShiftIds
      .map(idOrNo => {
        const cleanTarget = cleanShiftNo(idOrNo);
        if (Array.isArray(currentShifts) && currentShifts.length > 0) {
          const matched = currentShifts.find((s: any) => {
            if (s.shift_id && s.shift_id === idOrNo) return true;
            if (s.id && s.id === idOrNo) return true;
            const sNo = cleanShiftNo(s.shift_no || s.shift_number);
            return sNo && cleanTarget && sNo === cleanTarget;
          });
          if (matched && (matched.shift_id || matched.id)) {
            return String(matched.shift_id || matched.id);
          }
        }
        return findRealShiftId(idOrNo);
      })
      .filter(id => Boolean(id) && !id.startsWith("#"));

    const uniqueShiftIds = Array.from(new Set(resolvedShiftIds));

    if (uniqueShiftIds.length === 0) {
      toast.error("Please select valid shifts");
      return;
    }

    setIsFinding(true);
    try {
      const locationToSend = (locationType === "radius" && centerLocation)
        ? centerLocation
        : dynamicSiteLocation;

      const res = await findAvailableGuardsAction({
        invoice_id: invoiceId,
        shift_ids: uniqueShiftIds,
        guard_ids: selectedGuardIds,
        location: locationToSend || "",
        source: notificationSource || "both",
      });

      if (res.success) {
        toast.success(res.message || `Job opportunity sent successfully to ${selectedGuardIds.length} guard(s)`);
        if (onRefresh) onRefresh();
        fetchSentShifts();
        setActiveStep(0);
        setSelectedShiftIds([]);
        setSelectedGuardIds([]);
        resetFilters();
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
    setLocationType("radius");
    setServiceFilter("all");
    setNotificationSource("in_app");
    setRadiusMiles(50);
    setCenterLocation(dynamicSiteLocation);
    setMapCenter(initialCoordinates);
    setSelectedCities(invoiceLocation.city ? [invoiceLocation.city] : []);
    setSelectedStates(invoiceLocation.state ? [invoiceLocation.state] : []);
    setSelectedCountries(invoiceLocation.country ? [invoiceLocation.country] : []);
    setOnlyEligible(true);
    setIncludeNearby(true);
    setCurrentPage(1);
    setAllGuards([]);
    setHasSearched(false);

    // Matrix view filters & state reset
    setMatrixAvailabilityType("all");
    setMatrixGuards([]);
    setMatrixShiftNos([]);
    setHasMatrixSearched(false);
    setMatrixTotalGuards(0);
    setMatrixTotalPages(1);
    setMatrixCurrentPage(1);
    setIsShiftDropdownOpen(false);
    if (availableInvoiceShifts.length > 0) {
      setSelectedMatrixShiftIds([availableInvoiceShifts[0].shift_id]);
    } else {
      setSelectedMatrixShiftIds([]);
    }
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

  const renderStepper = () => (
    <div className="flex items-center justify-center py-2 px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveStep(1);
            loadStep1Shifts();
          }}
          disabled={activeStep === 1}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs",
            activeStep === 1
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200 border border-[#0064cb]"
              : "bg-white text-slate-800 border border-slate-200 hover:border-[#0064cb] hover:text-[#0064cb]"
          )}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
              activeStep === 1 ? "bg-white/20 text-white" : "bg-[#f0f4f9] text-[#0064cb]"
            )}
          >
            1
          </div>
          <span className="text-sm font-bold tracking-tight">Select Shift</span>
        </button>

        <ChevronRight className="w-4 h-4 text-slate-300" />

        <button
          type="button"
          onClick={() => {
            if (selectedShiftIds.length === 0 && selectedMatrixShifts.length === 0) {
              toast.error("Please select shifts first");
              return;
            }
            if (selectedShiftIds.length === 0 && selectedMatrixShifts.length > 0) {
              const ids = selectedMatrixShifts
                .map((s) => findRealShiftId(s))
                .filter(Boolean);
              setSelectedShiftIds(ids);
            }
            setActiveStep(2);
          }}
          disabled={activeStep === 2}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs",
            activeStep === 2
              ? "bg-[#0064cb] text-white shadow-md shadow-blue-200 border border-[#0064cb]"
              : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
          )}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
              activeStep === 2 ? "bg-white/20 text-white" : "bg-[#f8fafc] text-slate-400"
            )}
          >
            2
          </div>
          <span className="text-sm font-bold tracking-tight">Select Guard</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {renderStepper()}

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          {activeStep === 0 ? (
            <div>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Available Guards List
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-normal">
                  Find guards based on their responses for the selected shifts.
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end mb-6">
                  <div className="md:col-span-6 relative" ref={shiftDropdownRef}>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      <span className="inline-flex items-center gap-1">
                        Select shifts for which requests were sent
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      </span>
                    </label>
                    <div
                      onClick={() => setIsShiftDropdownOpen(!isShiftDropdownOpen)}
                      className="min-h-[42px] px-2.5 py-1.5 border border-slate-200 rounded-lg flex flex-wrap items-center gap-1.5 bg-white cursor-pointer hover:border-slate-300 transition-colors"
                    >
                      {isSentShiftsLoading ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 py-1">
                          <Loader2 className="w-3 h-3 animate-spin text-[#0064cb]" /> Loading shifts...
                        </span>
                      ) : selectedMatrixShifts.length > 0 ? (
                        selectedMatrixShifts.map((s, sIdx) => (
                          <span
                            key={`pill-${s.shift_id}-${sIdx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e8f1fc] text-[#0064cb] text-xs font-bold"
                          >
                            {s.shift_no}
                            {selectedMatrixShifts.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMatrixShift(s.shift_id);
                                }}
                                className="hover:text-blue-800 transition-colors cursor-pointer"
                                title="Remove shift"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Select shifts...</span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
                    </div>

                    {isShiftDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto space-y-1">
                        {isSentShiftsLoading ? (
                          <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#0064cb]" /> Loading shifts...
                          </div>
                        ) : availableInvoiceShifts.map((s, sIdx) => {
                          const isSelected = selectedMatrixShiftIds.includes(s.shift_id);
                          return (
                            <div
                              key={`dropdown-shift-${s.shift_id}-${sIdx}`}
                              onClick={() => handleToggleMatrixShift(s.shift_id)}
                              className={cn(
                                "px-3 py-2 rounded-md flex items-center justify-between text-xs cursor-pointer transition-colors",
                                isSelected ? "bg-blue-50 text-[#0064cb] font-semibold" : "hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => { }}
                                  className="rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb]"
                                />
                                <span className="font-bold">{s.shift_no}</span>
                                <span className="text-slate-500 font-normal">
                                  ({formatShiftDisplayDate(s.start_time)})
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {formatShiftDisplayTime(s.start_time, s.end_time)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Availability Type
                    </label>
                    <Select
                      value={matrixAvailabilityType}
                      onValueChange={(val: any) => setMatrixAvailabilityType(val)}
                    >
                      <SelectTrigger className="h-[42px] rounded-lg border-slate-200 text-xs font-semibold text-slate-800 bg-white cursor-pointer">
                        <SelectValue placeholder="Availability Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-xl z-50">
                        <SelectItem value="all" className="cursor-pointer py-2.5">
                          <div className="flex items-center gap-2.5 font-medium text-xs">
                            <Users className="w-4 h-4 text-slate-700 shrink-0" />
                            <span>All</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="available_all" className="cursor-pointer py-2.5">
                          <div className="flex items-center gap-2.5 font-medium text-xs">
                            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                            <span>Available for All Selected Shifts</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="available_any" className="cursor-pointer py-2.5">
                          <div className="flex items-center gap-2.5 font-medium text-xs">
                            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                            <span>Available for Any Selected Shifts</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="willing_to_travel_all" className="cursor-pointer py-2.5">
                          <div className="flex items-center gap-2.5 font-medium text-xs">
                            <Send className="w-3.5 h-3.5 text-blue-500 shrink-0 -rotate-45" />
                            <span>Willing to Travel for All Selected Shifts</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="willing_to_travel_any" className="cursor-pointer py-2.5">
                          <div className="flex items-center gap-2.5 font-medium text-xs">
                            <Send className="w-3.5 h-3.5 text-blue-500 shrink-0 -rotate-45" />
                            <span>Willing to Travel for Any Selected Shifts</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={() => fetchAvailableGuardsMatrix(1)}
                      disabled={isMatrixLoading || selectedMatrixShifts.length === 0 || isSentShiftsLoading}
                      className="w-full h-[42px] rounded-lg bg-[#0064cb] hover:bg-[#0052a8] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#0064cb]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMatrixLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      Search
                    </Button>
                  </div>
                </div>

                {selectedMatrixShifts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-900 mb-2.5">
                      Selected Shifts ({selectedMatrixShifts.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                      {selectedMatrixShifts.map((shift, idx) => (
                        <div
                          key={`card-${shift.shift_id}-${idx}`}
                          className="border border-blue-100 bg-[#f8fbff] rounded-xl p-3 flex items-start justify-between relative shadow-sm"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#e8f1fc] text-[#0064cb] flex items-center justify-center shrink-0 mt-0.5">
                              <CalendarDays className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#0064cb]">
                                {shift.shift_no}
                              </div>
                              <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                                {formatShiftDisplayDate(shift.start_time)}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {formatShiftDisplayTime(shift.start_time, shift.end_time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-2.5">
                  {isMatrixLoading ? (
                    <Skeleton className="h-4 w-36 bg-slate-200 rounded" />
                  ) : (
                    <p className="text-xs font-medium text-slate-600">
                      Showing {matrixGuards.length} of {matrixTotalGuards} guards
                    </p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto custom-scrollbar w-full">
                    <Table className="min-w-[850px] md:min-w-full">
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="text-[11px] font-bold text-slate-900 uppercase py-3.5 px-4">
                            GUARD NAME
                          </TableHead>
                          <TableHead className="text-[11px] font-bold text-slate-900 uppercase py-3.5 px-4">
                            EMAIL
                          </TableHead>
                          {(displayedShiftNos.length > 0
                            ? displayedShiftNos
                            : isMatrixLoading
                              ? ["...", "..."]
                              : []
                          ).map((shiftNo, idx) => (
                            <TableHead
                              key={`th-shift-${shiftNo}-${idx}`}
                              className="text-[11px] font-bold text-slate-900 uppercase py-3.5 px-4 text-center"
                            >
                              {shiftNo === "..." ? (
                                <Skeleton className="h-3 w-12 mx-auto bg-slate-200" />
                              ) : (
                                `#${shiftNo.replace(/^#/, "")}`
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isMatrixLoading ? (
                          Array.from({ length: 8 }).map((_, rIdx) => (
                            <TableRow
                              key={`matrix-skel-row-${rIdx}`}
                              className="border-slate-50 hover:bg-transparent"
                            >
                              <TableCell className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <Skeleton className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                                  <Skeleton
                                    className={cn(
                                      "h-4 rounded bg-slate-200",
                                      rIdx % 3 === 0
                                        ? "w-28"
                                        : rIdx % 3 === 1
                                          ? "w-36"
                                          : "w-24"
                                    )}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5 px-4">
                                <Skeleton
                                  className={cn(
                                    "h-4 rounded bg-slate-200",
                                    rIdx % 2 === 0 ? "w-40" : "w-32"
                                  )}
                                />
                              </TableCell>
                              {(displayedShiftNos.length > 0
                                ? displayedShiftNos
                                : ["1", "2"]
                              ).map((_, sIdx) => (
                                <TableCell
                                  key={`matrix-skel-cell-${rIdx}-${sIdx}`}
                                  className="py-3.5 px-4 text-center"
                                >
                                  <Skeleton className="w-6 h-6 rounded-full mx-auto bg-slate-200" />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : matrixGuards.length > 0 ? (
                          matrixGuards.map((guard: any, idx: number) => {
                            const guardId = guard.guard_id || guard.notification_id || `g-${idx}`;
                            const name = guard.guard_name || guard.name || "Guard";
                            const initials = getMatrixInitials(name);
                            const avatarColor = MATRIX_AVATAR_COLORS[initials] || "bg-indigo-100 text-indigo-700";

                            return (
                              <TableRow
                                key={`guard-${guardId}-${idx}`}
                                className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                              >
                                <TableCell className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                                        avatarColor
                                      )}
                                    >
                                      {initials}
                                    </div>
                                    <span className="font-bold text-sm text-slate-900">
                                      {name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-sm text-slate-600 font-normal">
                                  {guard.email || "-"}
                                </TableCell>
                                {displayedShiftNos.map((shiftNo, sIdx) => {
                                  const cleanNo = shiftNo.replace(/^#/, "").trim();
                                  const status =
                                    guard.shifts_data?.[cleanNo] ||
                                    guard.shifts_data?.[`#${cleanNo}`] ||
                                    "not_sent";

                                  return (
                                    <TableCell key={`cell-${guardId}-${cleanNo}-${sIdx}`} className="py-3 px-4 text-center">
                                      <MatrixStatusBadge status={status} />
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={2 + displayedShiftNos.length}
                              className="py-10 text-center text-slate-600 font-medium"
                            >
                              {!hasMatrixSearched
                                ? 'Click "Search" to view available guards for the selected shift(s).'
                                : "No guards found matching the selected criteria."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
                    <div className="text-xs text-slate-500 font-medium">
                      {isMatrixLoading ? (
                        <Skeleton className="h-4 w-40 bg-slate-200 rounded" />
                      ) : (
                        `Showing ${matrixGuards.length > 0 ? (matrixCurrentPage - 1) * 15 + 1 : 0} to ${Math.min(matrixCurrentPage * 15, matrixTotalGuards)} of ${matrixTotalGuards} guards`
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        disabled={matrixCurrentPage <= 1 || isMatrixLoading}
                        onClick={() => fetchAvailableGuardsMatrix(matrixCurrentPage - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.max(1, matrixTotalPages) }, (_, p) => p + 1).map((pg) => (
                        <Button
                          key={`page-${pg}`}
                          size="sm"
                          variant={pg === matrixCurrentPage ? "primary" : "outline"}
                          className={cn(
                            "w-8 h-8 p-0 font-bold text-xs cursor-pointer",
                            pg === matrixCurrentPage
                              ? "bg-[#0064cb] text-white hover:bg-[#0052a8]"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                          onClick={() => fetchAvailableGuardsMatrix(pg)}
                          disabled={isMatrixLoading}
                        >
                          {pg}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        disabled={matrixCurrentPage >= matrixTotalPages || isMatrixLoading}
                        onClick={() => fetchAvailableGuardsMatrix(matrixCurrentPage + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-slate-50/70 border border-slate-200/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MatrixStatusBadge status="available" />
                        <span className="text-xs text-slate-600 font-medium">Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MatrixStatusBadge status="unavailable" />
                        <span className="text-xs text-slate-600 font-medium">Unavailable</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MatrixStatusBadge status="pending" />
                        <span className="text-xs text-slate-600 font-medium">Pending</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MatrixStatusBadge status="willing_to_travel" />
                        <span className="text-xs text-slate-600 font-medium">Willing to Travel</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MatrixStatusBadge status="not_sent" />
                        <span className="text-xs text-slate-600 font-medium">Not Sent</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeStep === 1 ? "Select Shifts" : "Select Guards"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {activeStep === 1
                      ? "You can select multiple shifts"
                      : "Choose guards manually or use location filters to send job opportunity."}
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
                    onClick={() => {
                      setActiveStep(0);
                      resetFilters();
                    }}
                    className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto text-center shrink-0"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="p-0">
                {activeStep === 1 ? (
                  <div className="overflow-x-auto custom-scrollbar w-full">
                    <Table className="min-w-[650px] md:min-w-full">
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="w-[60px] py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                              checked={step1Shifts.length > 0 && selectedShiftIds.length === step1Shifts.length}
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
                        {isStep1ShiftsLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#0064cb]" />
                                <span>Loading shifts...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : step1Shifts.length > 0 ? (
                          step1Shifts.map((shift: any, idx: number) => {
                            const shiftKeyId = String(shift.shift_id || shift.id);
                            return (
                              <TableRow key={`step1-shift-${shiftKeyId || idx}-${idx}`} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <TableCell className="py-2.5 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                                    checked={selectedShiftIds.includes(shiftKeyId)}
                                    onChange={(e) => handleSelectShift(shiftKeyId, e.target.checked)}
                                  />
                                </TableCell>
                                <TableCell className="text-sm font-bold text-slate-700 py-2.5 px-4">
                                  <Link
                                    href={`/shift/view?shift_id=${shiftKeyId}`}
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
                            );
                          })
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
                              <Smartphone className={cn("w-5 h-5 shrink-0", notificationSource === "in_app" ? "text-[#0064cb]" : "text-slate-600")} />
                              <div>
                                <p className={cn(
                                  "text-xs font-bold leading-tight",
                                  notificationSource === "in_app" ? "text-[#0064cb]" : "text-slate-800"
                                )}>
                                  In App Notification
                                </p>
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
                              <MessageSquare className={cn("w-5 h-5 shrink-0", notificationSource === "sms" ? "text-[#0064cb]" : "text-slate-600")} />
                              <div>
                                <p className={cn(
                                  "text-xs font-bold leading-tight",
                                  notificationSource === "sms" ? "text-[#0064cb]" : "text-slate-800"
                                )}>
                                  SMS (Text Message)
                                </p>
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
                              <div className={cn(
                                "flex items-center -space-x-1 shrink-0",
                                notificationSource === "both" ? "text-[#0064cb]" : "text-slate-600"
                              )}>
                                <Smartphone className="w-4 h-4" />
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={cn(
                                  "text-xs font-bold leading-tight",
                                  notificationSource === "both" ? "text-[#0064cb]" : "text-slate-800"
                                )}>
                                  Both (Recommended)
                                </p>
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
                                  {(locationType === "all_guard" || locationType === "all") && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                                  <span>
                                    {locationType === "radius" && "Geographic Area ( Radius )"}
                                    {locationType === "city" && "City"}
                                    {locationType === "state" && "State"}
                                    {locationType === "country" && "Country"}
                                    {(locationType === "all_guard" || locationType === "all") && "All Guards"}
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
                                <SelectItem value="all_guard" className="text-xs cursor-pointer py-2">
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                    <span>All Guards</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Service</Label>
                            <Select
                              value={serviceFilter}
                              onValueChange={(val: "all" | "both" | "armed" | "unarmed") => setServiceFilter(val)}
                            >
                              <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                                  <span>
                                    {serviceFilter === "all" && "All"}
                                    {serviceFilter === "both" && "Both"}
                                    {serviceFilter === "armed" && "Armed"}
                                    {serviceFilter === "unarmed" && "Unarmed"}
                                  </span>
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 shadow-xl cursor-pointer">
                                <SelectItem value="all" className="text-xs cursor-pointer py-2">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                                    <span>All</span>
                                  </div>
                                </SelectItem>
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
                                <Label className="text-xs font-bold text-black">Site Location</Label>
                                <div className="relative">
                                  <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                  <Autocomplete
                                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAcL7f3q3X4BUlmdpjbo7ZY0GotX7Gh-sU"}
                                    value={centerLocation}
                                    onChange={(e: any) => handleCenterLocationChange(e.target.value)}
                                    onPlaceSelected={handlePlaceSelect}
                                    options={{
                                      types: ["geocode", "establishment"],
                                    }}
                                    placeholder="Search location with Google..."
                                    className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs text-black font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/10 transition-colors cursor-pointer"
                                    style={{ color: "#000000" }}
                                  />
                                  {centerLocation && (
                                    <button
                                      type="button"
                                      onClick={() => handleCenterLocationChange("")}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
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
                                  <SelectValue
                                    placeholder={
                                      selectedCities.length > 0
                                        ? selectedCities.join(", ")
                                        : isLocationsLoading
                                          ? "Loading cities..."
                                          : "Select City"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 max-h-56">
                                  {availableCities.filter((c) => !selectedCities.some((sc) => sc.toLowerCase() === c.toLowerCase())).length === 0 ? (
                                    <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                                      {isLocationsLoading ? "Loading cities..." : selectedCities.length > 0 ? "No more cities" : "No cities found"}
                                    </SelectItem>
                                  ) : (
                                    availableCities
                                      .filter((c) => !selectedCities.some((sc) => sc.toLowerCase() === c.toLowerCase()))
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
                                  <SelectValue
                                    placeholder={
                                      selectedStates.length > 0
                                        ? selectedStates.join(", ")
                                        : isLocationsLoading
                                          ? "Loading states..."
                                          : "Select State"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 max-h-56">
                                  {availableStates.filter((s) => !selectedStates.some((ss) => ss.toLowerCase() === s.toLowerCase())).length === 0 ? (
                                    <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                                      {isLocationsLoading ? "Loading states..." : selectedStates.length > 0 ? "No more states" : "No states found"}
                                    </SelectItem>
                                  ) : (
                                    availableStates
                                      .filter((s) => !selectedStates.some((ss) => ss.toLowerCase() === s.toLowerCase()))
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
                                  <SelectValue
                                    placeholder={
                                      selectedCountries.length > 0
                                        ? selectedCountries.join(", ")
                                        : isLocationsLoading
                                          ? "Loading countries..."
                                          : "Select Country"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 max-h-56">
                                  {availableCountries.filter((c) => !selectedCountries.some((sc) => sc.toLowerCase() === c.toLowerCase())).length === 0 ? (
                                    <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                                      {isLocationsLoading ? "Loading countries..." : selectedCountries.length > 0 ? "No more countries" : "No countries found"}
                                    </SelectItem>
                                  ) : (
                                    availableCountries
                                      .filter((c) => !selectedCountries.some((sc) => sc.toLowerCase() === c.toLowerCase()))
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

                          {(locationType === "all_guard" || locationType === "all") && (
                            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                              <Info className="w-4 h-4 text-[#0064cb] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block">All Guards</span>
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
                            <div className="flex items-center gap-1.5 font-bold text-black truncate max-w-[50%]" title={mapDisplayedLocation}>
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">{mapDisplayedLocation}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {locationType === "radius" ? (
                                <span>Radius: <strong className="text-slate-900">{radiusMiles} miles</strong></span>
                              ) : (
                                <span>Type: <strong className="text-slate-900 capitalize">{(locationType === "all_guard" || locationType === "all") ? "All Guards" : locationType}</strong></span>
                              )}
                              <span className="text-slate-300">|</span>
                              <span>Service: <strong className="text-slate-900 capitalize">{serviceFilter}</strong></span>
                              <span className="text-slate-300">|</span>
                              <span>Guards found: <strong className="text-[#0064cb] font-bold">{allGuards.length}</strong></span>
                            </div>
                          </div>

                          <DynamicGuardsMap
                            center={locationType === "radius" && isCustomRadiusLocation ? mapCenter : initialCoordinates}
                            radiusMiles={radiusMiles}
                            centerLocationName={mapDisplayedLocation}
                            guardsFoundCount={allGuards.length}
                            guards={allGuards}
                            locationType={locationType}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white">
                      <div className="px-6 py-4 border-b border-slate-100">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900">
                            Guards ({allGuards.length} found)
                          </h4>
                          <p className="text-xs text-slate-500">
                            Showing guards {locationType === "radius" ? `within ${radiusMiles} miles of ` : (locationType === "all_guard" || locationType === "all") ? "across " : "for "}
                            {locationType === "radius"
                              ? mapDisplayedLocation.split(",")[0]
                              : locationType === "city" && selectedCities.length > 0
                                ? selectedCities.join(", ")
                                : locationType === "state" && selectedStates.length > 0
                                  ? selectedStates.join(", ")
                                  : locationType === "country" && selectedCountries.length > 0
                                    ? selectedCountries.join(", ")
                                    : (locationType === "all_guard" || locationType === "all")
                                      ? "all guards"
                                      : dynamicSiteLocation.split(",")[0]}. Select guards to send the job opportunity.
                          </p>
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
                                    {index + 1}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
