"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { UserSearch, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  clientFetchGuardsNewAction,
  clientFetchLocationAction,
  FetchGuardsByLocationParams,
} from "@/lib/client-actions";
import { AvailableGuardsFilterAndMap } from "./_components/AvailableGuardsFilterAndMap";
import { AvailableGuardsListTable } from "./_components/AvailableGuardsListTable";
import {
  LocationType,
  ServiceFilterType,
} from "@/app/(main)/invoices/[id]/_components/available-guards/types";
import {
  getCoordinatesFromLocation,
} from "@/app/(main)/invoices/[id]/_components/available-guards/utils";

function FindAvailableGuardsContent() {
  const [locationType, setLocationType] = useState<LocationType>("radius");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilterType>("all");
  const [radiusMiles, setRadiusMiles] = useState<number>(50);
  const [centerLocation, setCenterLocation] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.0000, -97.0000]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [citySelectKey, setCitySelectKey] = useState<number>(0);
  const [stateSelectKey, setStateSelectKey] = useState<number>(0);
  const [countrySelectKey, setCountrySelectKey] = useState<number>(0);

  const [apiLocations, setApiLocations] = useState<{
    countries: string[];
    states: string[];
    cities: string[];
  }>({
    countries: [],
    states: [],
    cities: [],
  });
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [allGuards, setAllGuards] = useState<any[]>([]);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [isGuardsLoading, setIsGuardsLoading] = useState(false);

  useEffect(() => {
    if (locationType === "city" || locationType === "state" || locationType === "country") {
      const fetchLocations = async () => {
        setIsLocationsLoading(true);
        const res = await clientFetchLocationAction(undefined, undefined, "approved");
        if (res.success && res.data) {
          setApiLocations({
            countries: Array.isArray(res.data.countries) ? res.data.countries : [],
            states: Array.isArray(res.data.states) ? res.data.states : [],
            cities: Array.isArray(res.data.cities) ? res.data.cities : [],
          });
        }
        setIsLocationsLoading(false);
      };
      fetchLocations();
    }
  }, [locationType]);

  const handleSearchGuards = useCallback(async () => {
    if (locationType !== "all_guard" && locationType !== "all" && (!centerLocation || !centerLocation.trim())) {
      toast.error("Please enter a site location");
      return;
    }

    const params: FetchGuardsByLocationParams = {
      account_status: "active",
      service: serviceFilter,
      page: null,
    };

    if (locationType === "radius") {
      params.location_type = "geographic_area";
      params.radius = radiusMiles;
      if (centerLocation && centerLocation.trim()) {
        params.location = centerLocation.trim();
      }
    } else if (locationType === "city") {
      if (selectedCities.length === 0 && !centerLocation.trim()) {
        toast.error("Please select at least one city or enter a site location");
        return;
      }
      params.location_type = "cities";
      if (selectedCities.length > 0) {
        params.cities = selectedCities;
      }
      if (centerLocation && centerLocation.trim()) {
        params.location = centerLocation.trim();
      }
    } else if (locationType === "state") {
      if (selectedStates.length === 0 && !centerLocation.trim()) {
        toast.error("Please select at least one state or enter a site location");
        return;
      }
      params.location_type = "states";
      if (selectedStates.length > 0) {
        params.states = selectedStates;
      }
      if (centerLocation && centerLocation.trim()) {
        params.location = centerLocation.trim();
      }
    } else if (locationType === "country") {
      if (selectedCountries.length === 0 && !centerLocation.trim()) {
        toast.error("Please select at least one country or enter a site location");
        return;
      }
      params.location_type = "country";
      if (selectedCountries.length > 0) {
        params.country = selectedCountries;
      }
      if (centerLocation && centerLocation.trim()) {
        params.location = centerLocation.trim();
      }
    } else if (locationType === "all_guard" || locationType === "all") {
      params.location_type = "all_guard";
      if (centerLocation && centerLocation.trim()) {
        params.location = centerLocation.trim();
      }
    }

    setIsGuardsLoading(true);

    try {
      const res = await clientFetchGuardsNewAction(params);
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setAllGuards(data);
        setSelectedGuardIds(data.map((g: any) => g.guard_id).filter(Boolean));
        if (data.length === 0) {
          toast.info("No guards found matching your criteria.");
        }
      } else {
        toast.error(res.error || "Failed to load guards");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error searching available guards");
    } finally {
      setIsGuardsLoading(false);
    }
  }, [
    locationType,
    serviceFilter,
    radiusMiles,
    centerLocation,
    selectedCities,
    selectedStates,
    selectedCountries,
  ]);


  const handleCenterLocationChange = (val: string) => {
    setCenterLocation(val);
    if (val && val.trim()) {
      const coords = getCoordinatesFromLocation(val);
      if (coords) setMapCenter(coords);
    } else {
      setMapCenter([38.0000, -97.0000]);
    }
  };

  const handlePlaceSelected = (place: any) => {
    if (!place) return;
    const address = place.formatted_address || place.name || "";
    if (address) {
      setCenterLocation(address);
    }
    const lat = place.geometry?.location?.lat?.();
    const lng = place.geometry?.location?.lng?.();
    if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
    } else if (address) {
      const coords = getCoordinatesFromLocation(address);
      if (coords) {
        setMapCenter(coords);
      }
    }
  };

  const handleResetFilters = () => {
    setLocationType("radius");
    setServiceFilter("all");
    setRadiusMiles(50);
    setCenterLocation("");
    setMapCenter([38.0000, -97.0000]);
    setSelectedCities([]);
    setSelectedStates([]);
    setSelectedCountries([]);
    setSelectedGuardIds([]);
    setAllGuards([]);
    setCitySelectKey((prev) => prev + 1);
    setStateSelectKey((prev) => prev + 1);
    setCountrySelectKey((prev) => prev + 1);
  };

  const handleSelectGuard = useCallback((guardId: string, checked: boolean) => {
    setSelectedGuardIds((prev) => {
      const nextSet = new Set(prev);
      if (checked) {
        nextSet.add(guardId);
      } else {
        nextSet.delete(guardId);
      }
      return Array.from(nextSet);
    });
  }, []);

  const handleSelectAllGuards = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedGuardIds(allGuards.map((g: any) => g.guard_id).filter(Boolean));
    } else {
      setSelectedGuardIds([]);
    }
  }, [allGuards]);

  const displayedLocation =
    centerLocation.trim() ||
    (locationType === "city" && selectedCities.length > 0
      ? selectedCities.join(", ")
      : locationType === "state" && selectedStates.length > 0
      ? selectedStates.join(", ")
      : locationType === "country" && selectedCountries.length > 0
      ? selectedCountries.join(", ")
      : "United States");

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700">Guard Management</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900">Find Guards</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <UserSearch className="w-6 h-6 text-[#0064cb]" />
          Find Guards
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Search, locate, and explore active security guards by geographic radius, cities, states, or service qualification.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <AvailableGuardsFilterAndMap
          locationType={locationType}
          onLocationTypeChange={(type) => setLocationType(type)}
          serviceFilter={serviceFilter}
          onServiceFilterChange={(svc) => setServiceFilter(svc)}
          centerLocation={centerLocation}
          onCenterLocationChange={handleCenterLocationChange}
          onPlaceSelected={handlePlaceSelected}
          radiusMiles={radiusMiles}
          onRadiusChange={(r) => setRadiusMiles(r)}
          citySelectKey={citySelectKey}
          stateSelectKey={stateSelectKey}
          countrySelectKey={countrySelectKey}
          selectedCities={selectedCities}
          availableCities={apiLocations.cities}
          onAddCity={(c) => {
            setSelectedCities((prev) => [...prev, c]);
            if (!centerLocation) {
              const coords = getCoordinatesFromLocation(c);
              if (coords) setMapCenter(coords);
            }
          }}
          onRemoveCity={(c) => setSelectedCities((prev) => prev.filter((item) => item !== c))}
          selectedStates={selectedStates}
          availableStates={apiLocations.states}
          onAddState={(s) => {
            setSelectedStates((prev) => [...prev, s]);
            if (!centerLocation) {
              const coords = getCoordinatesFromLocation(s);
              if (coords) setMapCenter(coords);
            }
          }}
          onRemoveState={(s) => setSelectedStates((prev) => prev.filter((item) => item !== s))}
          selectedCountries={selectedCountries}
          availableCountries={apiLocations.countries}
          onAddCountry={(co) => {
            setSelectedCountries((prev) => [...prev, co]);
            if (!centerLocation) {
              const coords = getCoordinatesFromLocation(co);
              if (coords) setMapCenter(coords);
            }
          }}
          onRemoveCountry={(co) => setSelectedCountries((prev) => prev.filter((item) => item !== co))}
          isLocationsLoading={isLocationsLoading}
          isGuardsLoading={isGuardsLoading}
          onSearchGuards={handleSearchGuards}
          onResetFilters={handleResetFilters}
          mapDisplayedLocation={displayedLocation}
          mapCenter={mapCenter}
          allGuards={allGuards}
        />

        <AvailableGuardsListTable
          allGuards={allGuards}
          selectedGuardIds={selectedGuardIds}
          isGuardsLoading={isGuardsLoading}
          locationType={locationType}
          radiusMiles={radiusMiles}
          mapDisplayedLocation={displayedLocation}
          dynamicSiteLocation={displayedLocation}
          selectedCities={selectedCities}
          selectedStates={selectedStates}
          selectedCountries={selectedCountries}
          onSelectGuard={handleSelectGuard}
          onSelectAllGuards={handleSelectAllGuards}
        />
      </Card>
    </div>
  );
}

export default function FindAvailableGuardsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <FindAvailableGuardsContent />
    </Suspense>
  );
}
