"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Loader2,
  Plus,
} from "lucide-react";
import {
  clientFetchPersonnelProfilesAction,
  PersonnelProfileItem,
  PersonnelProfilesResponseData,
  SelectedPersonnelProfile,
} from "@/lib/client-actions";
import { cn } from "@/lib/utils";

export interface PersonnelProfileDropdownProps {
  trigger?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
  variant?: "outline" | "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  align?: "start" | "end" | "center";
  sideOffset?: number;
  onSelect: (selected: SelectedPersonnelProfile) => void;
  initialData?: PersonnelProfilesResponseData;
}

export function PersonnelProfileDropdown({
  trigger,
  label = "Assign Guard",
  icon = <Plus className="w-3.5 h-3.5" />,
  variant = "outline",
  className,
  disabled = false,
  align = "end",
  sideOffset = 6,
  onSelect,
  initialData,
}: PersonnelProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PersonnelProfilesResponseData>(
    initialData || { fastguard: [], agency: [], agent: [] }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(!!initialData);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const res = await clientFetchPersonnelProfilesAction();
      if (res.success && res.data) {
        setData({
          fastguard: Array.isArray(res.data.fastguard) ? res.data.fastguard : [],
          agency: Array.isArray(res.data.agency) ? res.data.agency : [],
          agent: Array.isArray(res.data.agent) ? res.data.agent : [],
        });
        setHasLoaded(true);
      }
    } catch (err) {
      console.error("[PersonnelProfileDropdown] Failed to fetch personnel profiles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setHasLoaded(true);
      return;
    }
    fetchProfiles();
  }, [initialData]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !hasLoaded && !initialData) {
      fetchProfiles();
    }
  };

  const fastguardItem = data.fastguard?.[0];
  const agencies = data.agency || [];
  const agents = data.agent || [];

  const handleSelectFastguard = (item?: PersonnelProfileItem) => {
    const target = item || fastguardItem || {
      id: "afa86a21-72e8-4629-85a7-b1f2052f278e",
      name: "FastGuard Service",
    };
    onSelect({
      category: "fastguard",
      categoryLabel: target.name || "FastGuard Service",
      id: target.id || "afa86a21-72e8-4629-85a7-b1f2052f278e",
      name: target.name || "FastGuard Service",
      email: target.email,
    });
    setOpen(false);
  };

  const handleSelectAgency = (agency: PersonnelProfileItem) => {
    onSelect({
      category: "agency",
      categoryLabel: "Agency",
      id: agency.id,
      name: agency.name,
      email: agency.email,
    });
    setOpen(false);
  };

  const handleSelectAgent = (agent: PersonnelProfileItem) => {
    onSelect({
      category: "agent",
      categoryLabel: "Agent",
      id: agent.id,
      name: agent.name,
      email: agent.email,
    });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant={variant}
            disabled={disabled}
            className={cn(
              "h-9 px-4 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer",
              disabled && "opacity-50 pointer-events-none grayscale",
              className
            )}
          >
            <span>{label}</span>
            {icon}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className="w-64 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <div className="px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Select Provider
          </span>
          {isLoading && (
            <Loader2 className="w-3 h-3 text-[#0064cb] animate-spin" />
          )}
        </div>

        {isLoading && !hasLoaded ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#0064cb]" />
            <span className="text-xs font-medium">Loading providers...</span>
          </div>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => handleSelectFastguard(fastguardItem)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-blue-50/80 focus:bg-blue-50/80 data-[highlighted]:bg-blue-50/80 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0064cb] flex items-center justify-center shrink-0 group-hover:bg-[#0064cb] group-focus:bg-[#0064cb] group-data-[highlighted]:bg-[#0064cb] group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition-colors">
                <ShieldCheck className="w-4 h-4 text-[#0064cb] group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#0064cb] group-focus:text-[#0064cb] group-data-[highlighted]:text-[#0064cb] transition-colors truncate block">
                  {fastguardItem?.name || "FastGuard Service"}
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-slate-100" />

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
                className="w-64 max-h-[320px] overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 custom-scrollbar"
                sideOffset={8}
              >
                <div className="px-2.5 py-1 mb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Agencies
                  </span>
                </div>
                {agencies.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No agencies available
                  </div>
                ) : (
                  agencies.map((agency) => (
                    <DropdownMenuItem
                      key={agency.id}
                      onClick={() => handleSelectAgency(agency)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-purple-50/80 focus:bg-purple-50/80 data-[highlighted]:bg-purple-50/80 transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-md bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-focus:bg-purple-600 group-data-[highlighted]:bg-purple-600 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition-colors">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white transition-colors" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-700 group-focus:text-purple-700 group-data-[highlighted]:text-purple-700 truncate min-w-0 flex-1">
                        {agency.name}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
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
                className="w-64 max-h-[320px] overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 custom-scrollbar"
                sideOffset={8}
              >
                <div className="px-2.5 py-1 mb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Agents
                  </span>
                </div>
                {agents.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No agents available
                  </div>
                ) : (
                  agents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-emerald-50/80 focus:bg-emerald-50/80 data-[highlighted]:bg-emerald-50/80 transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-md bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-focus:bg-emerald-600 group-data-[highlighted]:bg-emerald-600 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition-colors">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:!text-white group-focus:!text-white group-data-[highlighted]:!text-white transition-colors" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 group-focus:text-emerald-700 group-data-[highlighted]:text-emerald-700 truncate min-w-0 flex-1">
                        {agent.name}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
