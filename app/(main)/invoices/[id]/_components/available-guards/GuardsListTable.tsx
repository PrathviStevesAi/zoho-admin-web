"use client";

import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LocationType } from "./types";
import { getCityState, getDistance } from "./utils";

interface GuardsListTableProps {
  allGuards: any[];
  selectedGuardIds: string[];
  isGuardsLoading: boolean;
  locationType: LocationType;
  radiusMiles: number;
  mapDisplayedLocation: string;
  dynamicSiteLocation: string;
  selectedCities: string[];
  selectedStates: string[];
  selectedCountries: string[];
  onSelectGuard: (id: string, checked: boolean) => void;
  onSelectAllGuards: (checked: boolean) => void;
}

export function GuardsListTable({
  allGuards,
  selectedGuardIds,
  isGuardsLoading,
  locationType,
  radiusMiles,
  mapDisplayedLocation,
  dynamicSiteLocation,
  selectedCities,
  selectedStates,
  selectedCountries,
  onSelectGuard,
  onSelectAllGuards,
}: GuardsListTableProps) {
  const locationSubtitle = (
    <>
      Showing guards{" "}
      {locationType === "radius"
        ? `within ${radiusMiles} miles of `
        : locationType === "all_guard" || locationType === "all"
          ? "across "
          : "for "}
      {locationType === "radius"
        ? mapDisplayedLocation.split(",")[0]
        : locationType === "city"
          ? (selectedCities.length > 0 ? selectedCities.join(", ") : "selected city")
          : locationType === "state"
            ? (selectedStates.length > 0 ? selectedStates.join(", ") : "selected state")
            : locationType === "country"
              ? (selectedCountries.length > 0 ? selectedCountries.join(", ") : "selected country")
              : locationType === "all_guard" || locationType === "all"
                ? "all guards"
                : dynamicSiteLocation.split(",")[0]}
      . Select guards to send the job opportunity.
    </>
  );

  const hasVerticalScroll = allGuards.length > 15;

  return (
    <div className="bg-white">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900">
            Guards ({allGuards.length} found)
          </h4>
          <p className="text-xs text-slate-500">
            {locationSubtitle}
          </p>
        </div>
      </div>

      <div className="w-full">
        <Table
          containerClassName={hasVerticalScroll ? "max-h-[620px] overflow-y-auto" : ""}
          className="min-w-[1100px] md:min-w-full"
        >
          <TableHeader className={cn("bg-slate-50", hasVerticalScroll && "sticky top-0 z-20 shadow-sm")}>
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-[50px] py-2.5 px-4 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                  checked={allGuards.length > 0 && selectedGuardIds.length === allGuards.length}
                  onChange={(e) => onSelectAllGuards(e.target.checked)}
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
                      onChange={(e) => onSelectGuard(guard.guard_id, e.target.checked)}
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
                    {getCityState(guard)}
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
  );
}
