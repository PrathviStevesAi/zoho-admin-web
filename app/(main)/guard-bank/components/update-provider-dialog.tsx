"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Check,
  Loader2,
} from "lucide-react";
import {
  clientFetchPersonnelProfilesAction,
  clientUpdateGuardProviderAction,
  PersonnelProfilesResponseData,
  PersonnelProfileItem,
} from "@/lib/client-actions";
import { cn } from "@/lib/utils";

interface UpdateProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guard: any;
  onSuccess?: () => void;
}

export function UpdateProviderDialog({
  isOpen,
  onClose,
  guard,
  onSuccess,
}: UpdateProviderDialogProps) {
  const [providersData, setProvidersData] = useState<PersonnelProfilesResponseData>({
    fastguard: [],
    agency: [],
    agent: [],
  });
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [originalId, setOriginalId] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<"fastguard" | "agency" | "agent">("fastguard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const currentId = String(
      guard?.personnel_profile?.id ||
      guard?.personnel_profile_id ||
      ""
    ).trim();

    setSelectedId(currentId);
    setOriginalId(currentId);

    const profileType = guard?.personnel_profile?.profile_type?.toLowerCase?.();
    if (profileType === "agency") {
      setActiveCategory("agency");
    } else if (profileType === "agent") {
      setActiveCategory("agent");
    } else if (profileType === "fastguard") {
      setActiveCategory("fastguard");
    }

    const loadProfiles = async () => {
      setIsLoadingProviders(true);
      try {
        const res = await clientFetchPersonnelProfilesAction();
        if (res.success && res.data) {
          setProvidersData(res.data);
          const curIdLower = currentId.toLowerCase();
          const curNameLower = guard?.personnel_profile?.name?.toLowerCase?.().trim();
          if (curIdLower) {
            if (res.data.agency?.some((a) => String(a.id).toLowerCase() === curIdLower)) {
              setActiveCategory("agency");
            } else if (res.data.agent?.some((a) => String(a.id).toLowerCase() === curIdLower)) {
              setActiveCategory("agent");
            } else if (res.data.fastguard?.some((f) => String(f.id).toLowerCase() === curIdLower)) {
              setActiveCategory("fastguard");
            }
          } else if (curNameLower) {
            const foundAgency = res.data.agency?.find((a) => a.name?.toLowerCase().trim() === curNameLower);
            if (foundAgency) {
              setSelectedId(foundAgency.id);
              setOriginalId(foundAgency.id);
              setActiveCategory("agency");
            } else {
              const foundAgent = res.data.agent?.find((a) => a.name?.toLowerCase().trim() === curNameLower);
              if (foundAgent) {
                setSelectedId(foundAgent.id);
                setOriginalId(foundAgent.id);
                setActiveCategory("agent");
              } else {
                const foundFastguard = res.data.fastguard?.find((f) => f.name?.toLowerCase().trim() === curNameLower);
                if (foundFastguard) {
                  setSelectedId(foundFastguard.id);
                  setOriginalId(foundFastguard.id);
                  setActiveCategory("fastguard");
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch provider profiles:", err);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    loadProfiles();
  }, [isOpen, guard]);

  const fastguards = providersData.fastguard || [];
  const agencies = providersData.agency || [];
  const agents = providersData.agent || [];

  const defaultFastguard: PersonnelProfileItem = fastguards[0] || {
    id: guard?.personnel_profile?.id || "afa86a21-72e8-4629-85a7-b1f2052f278e",
    name: guard?.personnel_profile?.name || "FastGuard Service",
  };

  const currentProviderName = useMemo(() => {
    if (guard?.personnel_profile?.name) return guard.personnel_profile.name;
    const curId = originalId || guard?.personnel_profile?.id || guard?.personnel_profile_id;
    if (curId) {
      const all = [...fastguards, ...agencies, ...agents, defaultFastguard];
      const found = all.find((p) => String(p.id).toLowerCase() === String(curId).toLowerCase());
      if (found) return found.name;
    }
    return "Unassigned";
  }, [guard, originalId, fastguards, agencies, agents, defaultFastguard]);
  const isChanged = useMemo(() => {
    if (!selectedId) return false;
    return selectedId.toLowerCase().trim() !== originalId.toLowerCase().trim();
  }, [selectedId, originalId]);

  const isItemSelected = (item: { id: string; name?: string }) => {
    if (!selectedId || !item?.id) return false;
    return String(item.id).toLowerCase().trim() === String(selectedId).toLowerCase().trim();
  };

  const handleSave = async () => {
    if (!selectedId || !isChanged) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientUpdateGuardProviderAction(guard.id, selectedId);

      if (res.success) {
        toast.success(res.message || "Provider updated successfully");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || res.message || "Failed to update provider");
      }
    } catch (err: any) {
      console.error("Error updating provider:", err);
      toast.error(err?.message || "An error occurred while updating provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-w-[640px] w-full p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0064cb]/10 text-[#0064cb] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                  Update Provider
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {guard?.first_name} {guard?.last_name}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Current</span>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[140px] block">
                {currentProviderName}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 py-4 space-y-3.5">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveCategory("fastguard")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeCategory === "fastguard"
                  ? "bg-white text-[#0064cb] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FastGuard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("agency")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeCategory === "agency"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Agency ({agencies.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("agent")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeCategory === "agent"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Agent ({agents.length})</span>
            </button>
          </div>

          <div className="max-h-[260px] overflow-y-auto p-1 space-y-2 custom-scrollbar">
            {isLoadingProviders ? (
              <div className="h-28 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#0064cb]" />
                <span className="text-xs">Loading providers...</span>
              </div>
            ) : activeCategory === "fastguard" ? (
              <div className="space-y-2">
                {(fastguards.length > 0 ? fastguards : [defaultFastguard]).map((fg) => {
                  const isChecked = isItemSelected(fg);
                  return (
                    <button
                      key={fg.id}
                      type="button"
                      onClick={() => setSelectedId(fg.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isChecked
                          ? "border-[#0064cb] bg-blue-50/60"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isChecked
                              ? "bg-[#0064cb] text-white"
                              : "bg-blue-100/70 text-[#0064cb]"
                          )}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {fg.name}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ml-2",
                          isChecked
                            ? "bg-[#0064cb] border-[#0064cb] text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : activeCategory === "agency" ? (
              agencies.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-xs text-slate-400">
                  No agencies available
                </div>
              ) : (
                agencies.map((agency) => {
                  const isChecked = isItemSelected(agency);
                  return (
                    <button
                      key={agency.id}
                      type="button"
                      onClick={() => setSelectedId(agency.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isChecked
                          ? "border-purple-600 bg-purple-50/60"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isChecked
                              ? "bg-purple-600 text-white"
                              : "bg-purple-100 text-purple-700"
                          )}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {agency.name}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ml-2",
                          isChecked
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )
            ) : agents.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-xs text-slate-400">
                No agents available
              </div>
            ) : (
              agents.map((agent) => {
                const isChecked = isItemSelected(agent);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedId(agent.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isChecked
                        ? "border-emerald-600 bg-emerald-50/60"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isChecked
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {agent.name}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ml-2",
                        isChecked
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !isChanged}
            className={cn(
              "h-9 px-4 text-xs font-bold text-white shadow-md transition-all",
              !isChanged || isSubmitting
                ? "bg-slate-300 hover:bg-slate-300 text-slate-500 shadow-none cursor-not-allowed opacity-60"
                : "bg-[#0064cb] hover:bg-[#0052a8] text-white shadow-blue-200/50 cursor-pointer"
            )}
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Update Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
