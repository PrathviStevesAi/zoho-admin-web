"use client";

import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationSourceSelector } from "./NotificationSourceSelector";
import { GuardFiltersAndMap } from "./GuardFiltersAndMap";
import { GuardsListTable } from "./GuardsListTable";
import {
  LocationType,
  ServiceFilterType,
  NotificationSourceType,
} from "./types";

interface SelectGuardsStepProps {
  onBackToShifts: () => void;
  onCancel: () => void;
  onSendJobOpportunity: () => void;
  isFinding: boolean;

  notificationSource: NotificationSourceType;
  onNotificationSourceChange: (val: NotificationSourceType) => void;
  locationType: LocationType;
  onLocationTypeChange: (val: LocationType) => void;
  serviceFilter: ServiceFilterType;
  onServiceFilterChange: (val: ServiceFilterType) => void;
  centerLocation: string;
  onCenterLocationChange: (val: string) => void;
  onPlaceSelected: (place: any) => void;
  radiusMiles: number;
  onRadiusChange: (val: number | ((prev: number) => number)) => void;

  citySelectKey: number;
  stateSelectKey: number;
  countrySelectKey: number;
  selectedCities: string[];
  availableCities: string[];
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;

  selectedStates: string[];
  availableStates: string[];
  onAddState: (state: string) => void;
  onRemoveState: (state: string) => void;

  selectedCountries: string[];
  availableCountries: string[];
  onAddCountry: (country: string) => void;
  onRemoveCountry: (country: string) => void;
  isLocationsLoading: boolean;

  isGuardsLoading: boolean;
  onSearchGuards: () => void;
  onResetFilters: () => void;

  mapDisplayedLocation: string;
  dynamicSiteLocation: string;
  mapCenter: [number, number];

  allGuards: any[];
  selectedGuardIds: string[];
  onSelectGuard: (id: string, checked: boolean) => void;
  onSelectAllGuards: (checked: boolean) => void;
}

export function SelectGuardsStep({
  onBackToShifts,
  onCancel,
  onSendJobOpportunity,
  isFinding,
  notificationSource,
  onNotificationSourceChange,
  locationType,
  onLocationTypeChange,
  serviceFilter,
  onServiceFilterChange,
  centerLocation,
  onCenterLocationChange,
  onPlaceSelected,
  radiusMiles,
  onRadiusChange,
  citySelectKey,
  stateSelectKey,
  countrySelectKey,
  selectedCities,
  availableCities,
  onAddCity,
  onRemoveCity,
  selectedStates,
  availableStates,
  onAddState,
  onRemoveState,
  selectedCountries,
  availableCountries,
  onAddCountry,
  onRemoveCountry,
  isLocationsLoading,
  isGuardsLoading,
  onSearchGuards,
  onResetFilters,
  mapDisplayedLocation,
  dynamicSiteLocation,
  mapCenter,
  allGuards,
  selectedGuardIds,
  onSelectGuard,
  onSelectAllGuards,
}: SelectGuardsStepProps) {
  return (
    <div className="space-y-0">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">
            Select Guards
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Choose guards manually or use location filters to send job opportunity.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onBackToShifts}
          className="px-4 h-9 rounded-lg font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Shift
        </Button>
      </div>

      <NotificationSourceSelector
        notificationSource={notificationSource}
        onChange={onNotificationSourceChange}
      />

      <GuardFiltersAndMap
        locationType={locationType}
        onLocationTypeChange={onLocationTypeChange}
        serviceFilter={serviceFilter}
        onServiceFilterChange={onServiceFilterChange}
        centerLocation={centerLocation}
        onCenterLocationChange={onCenterLocationChange}
        onPlaceSelected={onPlaceSelected}
        radiusMiles={radiusMiles}
        onRadiusChange={onRadiusChange}
        citySelectKey={citySelectKey}
        stateSelectKey={stateSelectKey}
        countrySelectKey={countrySelectKey}
        selectedCities={selectedCities}
        availableCities={availableCities}
        onAddCity={onAddCity}
        onRemoveCity={onRemoveCity}
        selectedStates={selectedStates}
        availableStates={availableStates}
        onAddState={onAddState}
        onRemoveState={onRemoveState}
        selectedCountries={selectedCountries}
        availableCountries={availableCountries}
        onAddCountry={onAddCountry}
        onRemoveCountry={onRemoveCountry}
        isLocationsLoading={isLocationsLoading}
        isGuardsLoading={isGuardsLoading}
        onSearchGuards={onSearchGuards}
        onResetFilters={onResetFilters}
        mapDisplayedLocation={mapDisplayedLocation}
        mapCenter={mapCenter}
        allGuards={allGuards}
      />

      <GuardsListTable
        allGuards={allGuards}
        selectedGuardIds={selectedGuardIds}
        isGuardsLoading={isGuardsLoading}
        locationType={locationType}
        radiusMiles={radiusMiles}
        mapDisplayedLocation={mapDisplayedLocation}
        dynamicSiteLocation={dynamicSiteLocation}
        selectedCities={selectedCities}
        selectedStates={selectedStates}
        selectedCountries={selectedCountries}
        onSelectGuard={onSelectGuard}
        onSelectAllGuards={onSelectAllGuards}
      />

      <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-800">
          {selectedGuardIds.length} guards selected
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-5 h-9 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onSendJobOpportunity}
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
  );
}
