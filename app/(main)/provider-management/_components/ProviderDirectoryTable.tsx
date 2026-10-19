"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Plus,
  ChevronRight,
  ArrowLeft,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  clientFetchPersonnelProfilesAction,
  PersonnelProfileItem,
} from "@/lib/client-actions";
import { AgencyRegistrationForm } from "./AgencyRegistrationForm";
import { FastGuardGuardsTable } from "./FastGuardGuardsTable";

interface ProviderDirectoryTableProps {
  type: "fastguard" | "agency" | "agent";
}

export function ProviderDirectoryTable({ type }: ProviderDirectoryTableProps) {
  if (type === "fastguard") {
    return <FastGuardGuardsTable />;
  }

  const router = useRouter();
  const [items, setItems] = useState<PersonnelProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "register">("list");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await clientFetchPersonnelProfilesAction(type);
      if (res.success && res.data) {
        const currentList = res.data[type] || [];
        setItems(currentList);
      } else {
        toast.error(res.error || "Failed to load profiles");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong loading data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  const config = useMemo(() => {
    switch (type) {
      case "agency":
        return {
          directoryTitle: "Agency Directory",
          cardTitle: "Agencies List",
          breadcrumbLabel: "Agencies",
          pluralTitle: "Agencies",
          nameColumnLabel: "Agency Name",
          addLabel: "Add New Agency",
          icon: Building2,
        };
      case "agent":
        return {
          directoryTitle: "Agent Directory",
          cardTitle: "Agents List",
          breadcrumbLabel: "Agents",
          pluralTitle: "Agents",
          nameColumnLabel: "Agent Name",
          addLabel: "Add New Agent",
          icon: UserCheck,
        };
      default:
        return {
          directoryTitle: "FastGuard Service Guards",
          cardTitle: "FastGuard Service List",
          breadcrumbLabel: "FastGuard Service",
          pluralTitle: "Providers",
          nameColumnLabel: "Name",
          addLabel: "Add New Provider",
          icon: ShieldCheck,
        };
    }
  }, [type]);

  const IconComponent = config.icon;

  if (view === "register") {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
        <AgencyRegistrationForm
          type={type}
          onBack={() => setView("list")}
          onSuccess={(newId) => {
            if (newId) {
              router.push(`/provider-management/${type}/${newId}`);
            } else {
              setView("list");
              loadData();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Provider Management</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">{config.breadcrumbLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{config.directoryTitle}</h1>
        </div>
      </div>

      <div className="w-full">
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
          <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <IconComponent className="w-5 h-5 text-[#0064cb]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  {config.cardTitle}
                </CardTitle>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  {items.length} Registered {config.pluralTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
              <Button
                onClick={() => setView("register")}
                className="h-10 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-md font-bold shadow-md shadow-blue-200 transition-all active:scale-95 px-4 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> {config.addLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {config.nameColumnLabel}
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Phone Number
                    </TableHead>
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">
                      Total Guards
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent border-slate-50">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                            <Skeleton className="h-4 w-28 bg-slate-100" />
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-36 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-24 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <Skeleton className="h-6 w-8 mx-auto rounded-full bg-slate-100" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <IconComponent className="w-12 h-12 text-slate-200" />
                          <p className="text-sm font-medium text-slate-700">
                            No {config.pluralTitle.toLowerCase()} found
                          </p>
                          <Button
                            onClick={() => setView("register")}
                            variant="outline"
                            className="mt-2 h-9 text-xs font-bold rounded-md cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> {config.addLabel}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const guardsCount = item.total_guards ?? (item.assigned_guards ?? 0);
                      const rawPhone = item.phone_no || item.phone || item.phone_number || "---";
                      const displayPhone = rawPhone !== "---" ? rawPhone.trim().replace(/\s+/g, "") : "---";

                      return (
                        <TableRow
                          key={item.id}
                          onClick={() => router.push(`/provider-management/${type}/${item.id}`)}
                          className="group hover:bg-slate-50/70 border-slate-50 transition-colors cursor-pointer"
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                {item.name || "---"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">
                              {item.email || "---"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                              {displayPhone}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-6 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2.5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
                              {guardsCount}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
