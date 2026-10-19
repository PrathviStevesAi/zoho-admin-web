"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Users,
  ChevronDown,
  Check,
  Loader2,
  UserX,
} from "lucide-react";
import {
  clientFetchPersonnelProfilesAction,
  PersonnelProfilesResponseData,
  PersonnelProfileItem,
} from "@/lib/client-actions";
import { cn } from "@/lib/utils";

export interface GuardProviderFilterProps {
  value: string;
  onChange: (val: string) => void;
  providersData?: PersonnelProfilesResponseData;
  isLoading?: boolean;
  mounted?: boolean;
  triggerClassName?: string;
  showIcon?: boolean;
  allLabel?: string;
  showUnassigned?: boolean;
  showAll?: boolean;
}

const FASTGUARD_DEFAULT_ID = "afa86a21-72e8-4629-85a7-b1f2052f278e";

export function GuardProviderFilter({
  value = "all",
  onChange,
  providersData: externalProvidersData,
  isLoading: externalLoading = false,
  mounted = true,
  triggerClassName,
  showIcon = false,
  allLabel,
  showUnassigned = false,
  showAll = true,
}: GuardProviderFilterProps) {
  const [internalProvidersData, setInternalProvidersData] = useState<PersonnelProfilesResponseData>({
    fastguard: [],
    agency: [],
    agent: [],
  });
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (externalProvidersData) return;
    let isMounted = true;
    const fetchProfiles = async () => {
      setInternalLoading(true);
      try {
        const res = await clientFetchPersonnelProfilesAction();
        if (isMounted && res.success && res.data) {
          setInternalProvidersData(res.data);
        }
      } catch (err) {
        console.error("Failed to load provider profiles:", err);
      } finally {
        if (isMounted) setInternalLoading(false);
      }
    };
    fetchProfiles();
    return () => {
      isMounted = false;
    };
  }, [externalProvidersData]);

  const providersData = externalProvidersData || internalProvidersData;
  const isLoading = externalProvidersData ? externalLoading : internalLoading;

  const fastguards = providersData?.fastguard || [];
  const agencies = providersData?.agency || [];
  const agents = providersData?.agent || [];

  const { selectedLabel, selectedType } = useMemo(() => {
    if (!value || value === "all") {
      return { selectedLabel: allLabel || (showIcon ? "All" : "All Providers"), selectedType: "all" };
    }

    if (value === "unassigned") {
      return { selectedLabel: "No Assign Provider", selectedType: "unassigned" };
    }

    if (value === FASTGUARD_DEFAULT_ID || fastguards.some((fg) => String(fg.id) === String(value))) {
      const found = fastguards.find((fg) => String(fg.id) === String(value));
      return { selectedLabel: found?.name || "FastGuard Service", selectedType: "fastguard" };
    }

    if (agencies.some((a) => String(a.id) === String(value))) {
      const found = agencies.find((a) => String(a.id) === String(value));
      return { selectedLabel: found?.name || "Agency", selectedType: "agency" };
    }

    if (agents.some((ag) => String(ag.id) === String(value))) {
      const found = agents.find((ag) => String(ag.id) === String(value));
      return { selectedLabel: found?.name || "Agent", selectedType: "agent" };
    }

    return { selectedLabel: allLabel || (showIcon ? "All" : "All Providers"), selectedType: "all" };
  }, [value, fastguards, agencies, agents, showIcon, allLabel]);

  const TriggerIcon =
    selectedType === "agency"
      ? Building2
      : selectedType === "agent"
      ? UserCheck
      : selectedType === "fastguard"
      ? ShieldCheck
      : selectedType === "unassigned"
      ? UserX
      : Users;

  const triggerIconColor =
    selectedType === "agency"
      ? "text-purple-600"
      : selectedType === "agent"
      ? "text-emerald-600"
      : selectedType === "fastguard"
      ? "text-blue-600"
      : selectedType === "unassigned"
      ? "text-amber-600"
      : "text-blue-600";

  if (!mounted) {
    return <div className="h-10 border border-slate-200 rounded-md animate-pulse bg-slate-50" />;
  }

  const defaultFastguard: PersonnelProfileItem = fastguards[0] || {
    id: "afa86a21-72e8-4629-85a7-b1f2052f278e",
    name: "FastGuard Service",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-[#0064cb]/20 focus:border-[#0064cb] cursor-pointer",
            triggerClassName
          )}
        >
          {showIcon ? (
            <div className="flex items-center gap-2 min-w-0">
              <TriggerIcon className={cn("w-3.5 h-3.5 shrink-0", triggerIconColor)} />
              <span className="truncate text-left">{selectedLabel}</span>
            </div>
          ) : (
            <span className="truncate text-left font-medium text-slate-700">
              {selectedLabel}
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 opacity-80" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-64 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <div className="px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Select Provider
          </span>
          {isLoading && (
            <Loader2 className="w-3 h-3 text-[#0064cb] animate-spin" />
          )}
        </div>

        {showAll && (
          <DropdownMenuItem
            onClick={() => onChange("all")}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-blue-50/80 focus:bg-blue-50/80 data-[highlighted]:bg-blue-50/80 transition-colors group",
              value === "all" ? "bg-blue-50/80 font-semibold" : ""
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                "bg-blue-100/70 text-[#0064cb] group-hover:bg-[#0064cb] group-focus:bg-[#0064cb] group-data-[highlighted]:bg-[#0064cb] group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white",
                value === "all" ? "bg-[#0064cb] text-white" : ""
              )}
            >
              <Users
                className={cn(
                  "w-4 h-4 transition-colors group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white",
                  value === "all" ? "!text-white" : "text-[#0064cb]"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "text-xs font-bold block truncate transition-colors group-hover:text-[#0064cb] group-focus:text-[#0064cb] group-data-[highlighted]:text-[#0064cb]",
                  value === "all" ? "text-[#0064cb]" : "text-slate-900"
                )}
              >
                All
              </span>
            </div>
            {value === "all" && <Check className="w-4 h-4 text-[#0064cb]" />}
          </DropdownMenuItem>
        )}

        {showUnassigned && (
          <DropdownMenuItem
            onClick={() => onChange("unassigned")}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-amber-50/80 focus:bg-amber-50/80 data-[highlighted]:bg-amber-50/80 transition-colors group",
              value === "unassigned" ? "bg-amber-50/80 font-semibold" : ""
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                "bg-amber-100/70 text-amber-600 group-hover:bg-amber-600 group-focus:bg-amber-600 group-data-[highlighted]:bg-amber-600 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white",
                value === "unassigned" ? "bg-amber-600 text-white" : ""
              )}
            >
              <UserX
                className={cn(
                  "w-4 h-4 transition-colors group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white",
                  value === "unassigned" ? "!text-white" : "text-amber-600"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "text-xs font-bold block truncate transition-colors group-hover:text-amber-700 group-focus:text-amber-700 group-data-[highlighted]:text-amber-700",
                  value === "unassigned" ? "text-amber-700" : "text-slate-900"
                )}
              >
                No Assign Provider
              </span>
            </div>
            {value === "unassigned" && <Check className="w-4 h-4 text-amber-600" />}
          </DropdownMenuItem>
        )}

        {(showAll || showUnassigned) && (
          <DropdownMenuSeparator className="my-1 bg-slate-100" />
        )}

        {fastguards.length > 1 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-blue-50/80 focus:bg-blue-50/80 data-[highlighted]:bg-blue-50/80 data-[state=open]:bg-blue-50/80 transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0064cb] flex items-center justify-center shrink-0 group-hover:bg-[#0064cb] group-focus:bg-[#0064cb] group-data-[highlighted]:bg-[#0064cb] group-data-[state=open]:bg-[#0064cb] group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white group-data-[state=open]:text-white transition-colors">
                <ShieldCheck className="w-4 h-4 text-[#0064cb] group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white group-data-[state=open]:!text-white transition-colors" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#0064cb] group-focus:text-[#0064cb] group-data-[highlighted]:text-[#0064cb] group-data-[state=open]:text-[#0064cb] transition-colors">
                  Fastguard
                </span>
                <span className="text-[10px] text-slate-400 group-data-[state=open]:text-blue-600/70">
                  {fastguards.length} profiles
                </span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className="w-64 p-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
              sideOffset={8}
            >
              <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  FastGuard Profiles
                </span>
              </div>
              <div className="max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar">
                {fastguards.map((fg) => (
                  <DropdownMenuItem
                    key={fg.id}
                    onClick={() => onChange(fg.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-blue-50/80 focus:bg-blue-50/80 data-[highlighted]:bg-blue-50/80 transition-colors group",
                      value === fg.id ? "bg-blue-50 font-semibold" : ""
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-100/60 text-[#0064cb] flex items-center justify-center shrink-0 group-hover:bg-[#0064cb] group-focus:bg-[#0064cb] group-data-[highlighted]:bg-[#0064cb] group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0064cb] group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0064cb] group-focus:text-[#0064cb] group-data-[highlighted]:text-[#0064cb] truncate min-w-0 flex-1">
                      {fg.name}
                    </span>
                    {value === fg.id && (
                      <Check className="w-3.5 h-3.5 text-[#0064cb] shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem
            onClick={() => onChange(defaultFastguard.id)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-blue-50/80 focus:bg-blue-50/80 data-[highlighted]:bg-blue-50/80 transition-colors group",
              value === defaultFastguard.id ? "bg-blue-50 font-semibold" : ""
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                "bg-blue-100/70 text-[#0064cb] group-hover:bg-[#0064cb] group-focus:bg-[#0064cb] group-data-[highlighted]:bg-[#0064cb] group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white",
                value === defaultFastguard.id ? "bg-[#0064cb] text-white" : ""
              )}
            >
              <ShieldCheck
                className={cn(
                  "w-4 h-4 transition-colors group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white",
                  value === defaultFastguard.id ? "!text-white" : "text-[#0064cb]"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-[#0064cb] group-focus:text-[#0064cb] group-data-[highlighted]:text-[#0064cb] truncate block">
                {defaultFastguard.name || "FastGuard Service"}
              </span>
            </div>
            {value === defaultFastguard.id && (
              <Check className="w-4 h-4 text-[#0064cb]" />
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-purple-50/80 focus:bg-purple-50/80 data-[highlighted]:bg-purple-50/80 data-[state=open]:bg-purple-50/80 transition-colors group">
            <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-focus:bg-purple-700 group-data-[highlighted]:bg-purple-700 group-data-[state=open]:bg-purple-700 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white group-data-[state=open]:text-white transition-colors">
              <Building2 className="w-4 h-4 text-purple-700 group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white group-data-[state=open]:!text-white transition-colors" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 group-focus:text-purple-700 group-data-[highlighted]:text-purple-700 group-data-[state=open]:text-purple-700 transition-colors">
                Agency
              </span>
              <span className="text-[10px] text-slate-400 group-data-[state=open]:text-purple-600/70">
                {agencies.length} agenc{agencies.length === 1 ? "y" : "ies"}
              </span>
            </div>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent
            className="w-64 p-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            sideOffset={8}
          >
            <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Agencies
              </span>
            </div>
            <div className="max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar">
              {agencies.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No agencies available
                </div>
              ) : (
                agencies.map((agency) => (
                  <DropdownMenuItem
                    key={agency.id}
                    onClick={() => onChange(agency.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-purple-50/80 focus:bg-purple-50/80 data-[highlighted]:bg-purple-50/80 transition-colors group",
                      value === agency.id ? "bg-purple-50 font-semibold" : ""
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-focus:bg-purple-600 group-data-[highlighted]:bg-purple-600 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition-colors">
                      <Building2 className="w-3.5 h-3.5 text-purple-600 group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-700 group-focus:text-purple-700 group-data-[highlighted]:text-purple-700 truncate min-w-0 flex-1">
                      {agency.name}
                    </span>
                    {value === agency.id && (
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-emerald-50/80 focus:bg-emerald-50/80 data-[highlighted]:bg-emerald-50/80 data-[state=open]:bg-emerald-50/80 transition-colors group">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-focus:bg-emerald-700 group-data-[highlighted]:bg-emerald-700 group-data-[state=open]:bg-emerald-700 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white group-data-[state=open]:text-white transition-colors">
              <UserCheck className="w-4 h-4 text-emerald-700 group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white group-data-[state=open]:!text-white transition-colors" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 group-focus:text-emerald-700 group-data-[highlighted]:text-emerald-700 group-data-[state=open]:text-emerald-700 transition-colors">
                Agent
              </span>
              <span className="text-[10px] text-slate-400 group-data-[state=open]:text-emerald-600/70">
                {agents.length} agent{agents.length === 1 ? "" : "s"}
              </span>
            </div>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent
            className="w-64 p-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            sideOffset={8}
          >
            <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Agents
              </span>
            </div>
            <div className="max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar">
              {agents.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No agents available
                </div>
              ) : (
                agents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => onChange(agent.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-emerald-50/80 focus:bg-emerald-50/80 data-[highlighted]:bg-emerald-50/80 transition-colors group",
                      value === agent.id ? "bg-emerald-50 font-semibold" : ""
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-focus:bg-emerald-600 group-data-[highlighted]:bg-emerald-600 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition-colors">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 group-focus:text-emerald-700 group-data-[highlighted]:text-emerald-700 truncate min-w-0 flex-1">
                      {agent.name}
                    </span>
                    {value === agent.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
