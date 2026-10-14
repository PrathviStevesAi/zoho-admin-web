"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/excel-utils";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LocationType } from "@/app/(main)/invoices/[id]/_components/available-guards/types";
import { getCityState, getDistance } from "@/app/(main)/invoices/[id]/_components/available-guards/utils";

interface AvailableGuardsListTableProps {
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

export function AvailableGuardsListTable({
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
}: AvailableGuardsListTableProps) {
  const selectedGuardIdsSet = useMemo(
    () => new Set(selectedGuardIds),
    [selectedGuardIds]
  );

  const locationSubtitle = (
    <>
      Showing guards{" "}
      {locationType === "radius"
        ? `within ${radiusMiles} miles of `
        : locationType === "all_guard" || locationType === "all"
          ? "across "
          : "for "}
      {locationType === "radius"
        ? (mapDisplayedLocation || "United States").split(",")[0]
        : locationType === "city"
          ? (selectedCities.length > 0 ? selectedCities.join(", ") : "selected city")
          : locationType === "state"
            ? (selectedStates.length > 0 ? selectedStates.join(", ") : "selected state")
            : locationType === "country"
              ? (selectedCountries.length > 0 ? selectedCountries.join(", ") : "selected country")
              : locationType === "all_guard" || locationType === "all"
                ? "all guards"
                : (dynamicSiteLocation || "United States").split(",")[0]}
      . Select guards to send the job opportunity.
    </>
  );

  const hasVerticalScroll = allGuards.length > 15;

  const handleExport = () => {
    if (allGuards.length === 0) {
      toast.info("No guard data to export.");
      return;
    }

    const exportList =
      selectedGuardIds.length > 0 && selectedGuardIds.length < allGuards.length
        ? allGuards.filter((g) => selectedGuardIdsSet.has(g.guard_id))
        : allGuards;

    const dataToExport = exportList.map((g, idx) => ({
      "#": idx + 1,
      Name: `${g.first_name || ""} ${g.last_name || ""}`.trim() || g.name || "-",
      Email: g.email || "-",
      "Phone Number": g.phone_number || "-",
      "City, State": getCityState(g),
      Distance: getDistance(g),
      Armed: g.armed ? "Yes" : "No",
      Unarmed: g.unarmed ? "Yes" : "No",
      "Guard Level": g.guard_level !== undefined && g.guard_level !== null ? g.guard_level : "-",
      Status: g.account_status || "Active",
    }));

    exportToExcel(
      dataToExport,
      [],
      `Available_Guards_${new Date().toISOString().split("T")[0]}`
    );
    toast.success(`Exported ${exportList.length} guard${exportList.length > 1 ? "s" : ""} to Excel`);
  };

  return (
    <div className="bg-white">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900">
            Guards ({allGuards.length} found)
          </h4>
          <p className="text-xs text-slate-500">
            {locationSubtitle}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={allGuards.length === 0}
          onClick={handleExport}
          className="h-9 px-3.5 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title="Export guards to Excel"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export</span>
          {selectedGuardIds.length > 0 && selectedGuardIds.length < allGuards.length && (
            <span className="text-[11px] text-slate-500 font-normal">
              ({selectedGuardIds.length})
            </span>
          )}
        </Button>
      </div>

      <div className="w-full">
        <Table
          containerClassName={cn("w-full overflow-x-hidden", hasVerticalScroll && "max-h-[620px] overflow-y-auto")}
          className="w-full"
        >
          <TableHeader className={cn("bg-slate-50", hasVerticalScroll && "sticky top-0 z-20 shadow-sm")}>
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-10 py-2.5 px-3 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                  checked={allGuards.length > 0 && selectedGuardIds.length === allGuards.length}
                  onChange={(e) => onSelectAllGuards(e.target.checked)}
                />
              </TableHead>
              <TableHead className="w-10 text-[11px] font-bold text-slate-700 uppercase py-2.5 px-2 text-center">#</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3">NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3">EMAIL</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3">PHONE NUMBER</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3">CITY, STATE</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3">DISTANCE</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-700 uppercase py-2.5 px-3 text-center">GUARD LEVEL</TableHead>
              <TableHead className="w-20 text-[11px] font-bold text-slate-700 uppercase py-2.5 px-2 text-center">ARMED</TableHead>
              <TableHead className="w-20 text-[11px] font-bold text-slate-700 uppercase py-2.5 px-2 text-center">UNARMED</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-700 uppercase py-2.5 px-2 text-center">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isGuardsLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center">
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
                  <TableCell className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                      checked={selectedGuardIdsSet.has(guard.guard_id)}
                      onChange={(e) => onSelectGuard(guard.guard_id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-2.5 px-2 text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-[13px] font-bold text-slate-900 py-2.5 px-3 truncate max-w-[200px]">
                    {guard.application_id || guard.guard_id || guard.id ? (
                      <Link
                        href={`/guard-bank/${guard.application_id || guard.guard_id || guard.id}`}
                        className="hover:text-[#0064cb] hover:underline transition-colors block truncate"
                        title={`${guard.first_name || ""} ${guard.last_name || ""}`}
                      >
                        {guard.first_name || ""} {guard.last_name || ""}
                      </Link>
                    ) : (
                      <span className="block truncate" title={`${guard.first_name || ""} ${guard.last_name || ""}`}>
                        {guard.first_name || ""} {guard.last_name || ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-2.5 px-3 truncate max-w-[220px]" title={guard.email || ""}>
                    {guard.email || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-2.5 px-3 whitespace-nowrap" title={guard.phone_number || ""}>
                    {guard.phone_number || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-2.5 px-3 truncate max-w-[180px]" title={getCityState(guard)}>
                    {getCityState(guard)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 py-2.5 px-3 whitespace-nowrap">
                    {getDistance(guard)}
                  </TableCell>
                  <TableCell className="text-xs py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
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
                  <TableCell className="text-xs py-2.5 px-2 text-center whitespace-nowrap">
                    {guard.armed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-2.5 px-2 text-center whitespace-nowrap">
                    {guard.unarmed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-2.5 px-2 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {guard.account_status || "Active"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="py-12 text-center text-xs text-slate-500"
                >
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
