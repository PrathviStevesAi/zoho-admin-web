"use client";

import { useState } from "react";
import { Banknote, Loader2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GuardPriceTabProps {
  pricesData: Record<string, Record<string, Record<string, number>>>;
  setPricesData: React.Dispatch<React.SetStateAction<Record<string, Record<string, Record<string, number>>>>>;
  selectedTerritory: string;
  setSelectedTerritory: (val: string) => void;
  submittingPrices: boolean;
  handleSubmitPrices: () => void;
  loading: boolean;
  mounted: boolean;
  hasChanges: boolean;
}

export function GuardPriceTab({
  pricesData,
  setPricesData,
  selectedTerritory,
  setSelectedTerritory,
  submittingPrices,
  handleSubmitPrices,
  loading,
  mounted,
  hasChanges
}: GuardPriceTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const renderSelect = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    options: string[],
    allLabel: string,
    triggerClassName: string = "bg-slate-50"
  ) => {
    if (!mounted) {
      return <div className={cn("h-10 border border-slate-200 rounded-md animate-pulse", triggerClassName)} />;
    }
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-10 border-slate-200", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
      <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <Banknote className="w-6 h-6 text-[#0064cb]" strokeWidth={2.5} />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Guards Prices</h2>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          {renderSelect(selectedTerritory, setSelectedTerritory, "Select Territory", Object.keys(pricesData), "All Territories", "bg-white")}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex-1 sm:flex-none text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 px-8 h-10"
            >
              Edit
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(false)}
              variant="ghost"
              className="flex-1 sm:flex-none text-slate-500 hover:text-slate-700 px-8 h-10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            onClick={() => {
              handleSubmitPrices();
              setIsEditing(false);
            }}
            disabled={submittingPrices || !hasChanges || loading || !isEditing}
            className="flex-1 sm:flex-none bg-[#0064cb] hover:bg-[#0064cb]/90 text-white px-8 h-10 flex items-center justify-center gap-2"
          >
            {submittingPrices && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : Object.keys(pricesData).length === 0 ? (
        <div className="py-8 text-center text-slate-500 font-medium">No prices data available</div>
      ) : (
        <div className="space-y-8">
          {Object.keys(pricesData)
            .filter(t => selectedTerritory === "all" || t === selectedTerritory)
            .map((territoryName) => {
              const territoryData = pricesData[territoryName];
              return (
                <div key={territoryName} className="space-y-6">
                  <div className="bg-[#0064cb] rounded-lg p-3 px-5 shadow-sm">
                    <h3 className="text-white font-bold text-lg">{territoryName}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.keys(territoryData).map((stateName) => {
                      const statePrices = territoryData[stateName];
                      return (
                        <div key={stateName} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-800 text-[16px]">{stateName}</h4>
                          </div>

                          <div className="p-5 space-y-3">
                            {Object.keys(statePrices).map((serviceName) => (
                              <div key={serviceName} className="flex items-center justify-between group">
                                <span className="text-[13px] text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                                  {serviceName}
                                </span>
                                <Input
                                  type="number"
                                  value={statePrices[serviceName]}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    const newVal = parseFloat(e.target.value) || 0;
                                    setPricesData(prev => ({
                                      ...prev,
                                      [territoryName]: {
                                        ...prev[territoryName],
                                        [stateName]: {
                                          ...prev[territoryName][stateName],
                                          [serviceName]: newVal
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-16 h-8 text-center text-[13px] font-medium bg-slate-50 border-slate-200 focus-visible:ring-[#0064cb]/20"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
