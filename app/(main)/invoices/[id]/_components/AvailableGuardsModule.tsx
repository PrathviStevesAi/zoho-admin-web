"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  clientFetchGuardsNewAction,
  clientFetchLocationAction,
  clientFetchAvailableGuardsShiftsAction,
  clientFetchAvailableGuardsMatrixAction,
  clientFetchInvoiceShiftsAction,
  AvailableGuardItem,
  FetchGuardsByLocationParams,
} from "@/lib/client-actions";
import { findAvailableGuardsAction } from "@/actions/dashboard.actions";

import {
  AvailableGuardsModuleProps,
  MatrixAvailabilityType,
  LocationType,
  ServiceFilterType,
  NotificationSourceType,
} from "./available-guards/types";
import {
  cleanShiftNo,
  getCoordinatesFromLocation,
} from "./available-guards/utils";
import { AvailableGuardsStepper } from "./available-guards/AvailableGuardsStepper";
import { AvailableGuardsMatrixView } from "./available-guards/AvailableGuardsMatrixView";
import { SelectShiftsStep } from "./available-guards/SelectShiftsStep";
import { SelectGuardsStep } from "./available-guards/SelectGuardsStep";

export type { AvailableGuardsModuleProps };

export function AvailableGuardsModule({
  invoiceId,
  invoice,
  guards: results,
  shifts,
  isLoading: isResultsLoading,
  onBack,
  onRefresh,
  totalGuards,
}: AvailableGuardsModuleProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [allGuards, setAllGuards] = useState<any[]>([]);
  const [isGuardsLoading, setIsGuardsLoading] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [notificationSource, setNotificationSource] = useState<NotificationSourceType>("in_app");
  const [locationType, setLocationType] = useState<LocationType>("radius");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilterType>("all");

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
      const matchById = shiftList.find((s: any) =>
        (s.shift_id && s.shift_id === strVal) || (s.id && s.id === strVal)
      );
      if (matchById && (matchById.shift_id || matchById.id)) {
        return String(matchById.shift_id || matchById.id);
      }

      if (targetNo) {
        const matchByNo = shiftList.find((s: any) =>
          cleanShiftNo(s.shift_no || s.shift_number) === targetNo
        );
        if (matchByNo && (matchByNo.shift_id || matchByNo.id)) {
          return String(matchByNo.shift_id || matchByNo.id);
        }
      }

      const matchByStrNo = shiftList.find((s: any) =>
        cleanShiftNo(s.shift_no || s.shift_number) === cleanShiftNo(strVal)
      );
      if (matchByStrNo && (matchByStrNo.shift_id || matchByStrNo.id)) {
        return String(matchByStrNo.shift_id || matchByStrNo.id);
      }
    }

    return strVal;
  }, [step1Shifts, shifts]);

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
  }, [sentShifts, shifts, step1Shifts]);

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

  const [matrixAvailabilityType, setMatrixAvailabilityType] = useState<MatrixAvailabilityType>("all");

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

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [citySelectKey, setCitySelectKey] = useState(0);
  const [stateSelectKey, setStateSelectKey] = useState(0);
  const [countrySelectKey, setCountrySelectKey] = useState(0);

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
    setCitySelectKey((k) => k + 1);
  };

  const handleRemoveCity = (nameToRemove: string) => {
    setSelectedCities((prev) => prev.filter((c) => c.toLowerCase() !== nameToRemove.toLowerCase()));
  };

  const handleAddState = (stateName: string) => {
    if (!stateName) return;
    if (!selectedStates.some((s) => s.toLowerCase() === stateName.toLowerCase())) {
      setSelectedStates((prev) => [...prev, stateName]);
    }
    setStateSelectKey((k) => k + 1);
  };

  const handleRemoveState = (nameToRemove: string) => {
    setSelectedStates((prev) => prev.filter((s) => s.toLowerCase() !== nameToRemove.toLowerCase()));
  };

  const handleAddCountry = (countryName: string) => {
    if (!countryName) return;
    if (!selectedCountries.some((c) => c.toLowerCase() === countryName.toLowerCase())) {
      setSelectedCountries((prev) => [...prev, countryName]);
    }
    setCountrySelectKey((k) => k + 1);
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

  const [hasSearched, setHasSearched] = useState(false);
  const loadGuards = async () => {
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
      if (selectedCities.length === 0) {
        toast.error("Please select at least one city");
        return;
      }
      params.location_type = "cities";
      params.cities = selectedCities;
    } else if (locationType === "state") {
      if (selectedStates.length === 0) {
        toast.error("Please select at least one state");
        return;
      }
      params.location_type = "states";
      params.states = selectedStates;
    } else if (locationType === "country") {
      if (selectedCountries.length === 0) {
        toast.error("Please select at least one country");
        return;
      }
      params.location_type = "country";
      params.country = selectedCountries;
    } else if (locationType === "all_guard" || locationType === "all") {
      params.location_type = "all_guard";
    }

    setIsGuardsLoading(true);
    setHasSearched(true);

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

  const handleLocationTypeChange = (type: LocationType) => {
    setLocationType(type);
    setMapCenter(initialCoordinates);
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

  const handleSelectGuard = useCallback((id: string, checked: boolean) => {
    setSelectedGuardIds(prev => {
      const nextSet = new Set(prev);
      if (checked) {
        nextSet.add(id);
      } else {
        nextSet.delete(id);
      }
      return Array.from(nextSet);
    });
  }, []);

  const handleSelectAllGuards = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedGuardIds(allGuards.map(g => g.guard_id));
    } else {
      setSelectedGuardIds([]);
    }
  }, [allGuards]);

  const resetFilters = () => {
    setLocationType("radius");
    setServiceFilter("all");
    setNotificationSource("in_app");
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
    setMatrixAvailabilityType("all");
    setMatrixGuards([]);
    setMatrixShiftNos([]);
    setHasMatrixSearched(false);
    setMatrixTotalGuards(0);
    setMatrixTotalPages(1);
    setMatrixCurrentPage(1);
    if (availableInvoiceShifts.length > 0) {
      setSelectedMatrixShiftIds([availableInvoiceShifts[0].shift_id]);
    } else {
      setSelectedMatrixShiftIds([]);
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

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <AvailableGuardsStepper
        activeStep={activeStep}
        onStep1Click={() => {
          setActiveStep(1);
          loadStep1Shifts();
        }}
        onStep2Click={() => {
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
      />

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-7xl mx-auto">
        <CardContent className="p-0">
          {activeStep === 0 ? (
            <AvailableGuardsMatrixView
              isSentShiftsLoading={isSentShiftsLoading}
              selectedMatrixShifts={selectedMatrixShifts}
              availableInvoiceShifts={availableInvoiceShifts}
              selectedMatrixShiftIds={selectedMatrixShiftIds}
              onToggleMatrixShift={handleToggleMatrixShift}
              onRemoveMatrixShift={handleRemoveMatrixShift}
              matrixAvailabilityType={matrixAvailabilityType}
              onMatrixAvailabilityTypeChange={setMatrixAvailabilityType}
              isMatrixLoading={isMatrixLoading}
              onSearch={fetchAvailableGuardsMatrix}
              matrixGuards={matrixGuards}
              displayedShiftNos={displayedShiftNos}
              matrixTotalGuards={matrixTotalGuards}
              matrixTotalPages={matrixTotalPages}
              matrixCurrentPage={matrixCurrentPage}
              hasMatrixSearched={hasMatrixSearched}
              onPageChange={fetchAvailableGuardsMatrix}
            />
          ) : activeStep === 1 ? (
            <SelectShiftsStep
              step1Shifts={step1Shifts}
              selectedShiftIds={selectedShiftIds}
              isStep1ShiftsLoading={isStep1ShiftsLoading}
              onSelectShift={handleSelectShift}
              onSelectAllShifts={handleSelectAllShifts}
              onCancel={() => {
                setActiveStep(0);
                resetFilters();
              }}
              onProceedToStep2={() => {
                if (selectedShiftIds.length === 0) {
                  toast.error("Please select shifts first");
                } else {
                  setActiveStep(2);
                }
              }}
            />
          ) : activeStep === 2 ? (
            <SelectGuardsStep
              onBackToShifts={() => setActiveStep(1)}
              onCancel={() => {
                setActiveStep(0);
                resetFilters();
              }}
              onSendJobOpportunity={handleFind}
              isFinding={isFinding}
              notificationSource={notificationSource}
              onNotificationSourceChange={setNotificationSource}
              locationType={locationType}
              onLocationTypeChange={handleLocationTypeChange}
              serviceFilter={serviceFilter}
              onServiceFilterChange={setServiceFilter}
              centerLocation={centerLocation}
              onCenterLocationChange={handleCenterLocationChange}
              onPlaceSelected={handlePlaceSelect}
              radiusMiles={radiusMiles}
              onRadiusChange={setRadiusMiles}
              citySelectKey={citySelectKey}
              stateSelectKey={stateSelectKey}
              countrySelectKey={countrySelectKey}
              selectedCities={selectedCities}
              availableCities={availableCities}
              onAddCity={handleAddCity}
              onRemoveCity={handleRemoveCity}
              selectedStates={selectedStates}
              availableStates={availableStates}
              onAddState={handleAddState}
              onRemoveState={handleRemoveState}
              selectedCountries={selectedCountries}
              availableCountries={availableCountries}
              onAddCountry={handleAddCountry}
              onRemoveCountry={handleRemoveCountry}
              isLocationsLoading={isLocationsLoading}
              isGuardsLoading={isGuardsLoading}
              onSearchGuards={loadGuards}
              onResetFilters={resetFilters}
              mapDisplayedLocation={mapDisplayedLocation}
              dynamicSiteLocation={dynamicSiteLocation}
              mapCenter={locationType === "radius" && isCustomRadiusLocation ? mapCenter : initialCoordinates}
              allGuards={allGuards}
              selectedGuardIds={selectedGuardIds}
              onSelectGuard={handleSelectGuard}
              onSelectAllGuards={handleSelectAllGuards}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
