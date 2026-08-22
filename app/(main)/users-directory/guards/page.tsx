"use client";

import {
  clientFetchGuardsAction,
  clientResendGuardPasswordAction
} from "@/lib/client-actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/app/(main)/guard-bank/components/confirmation-dialog";
import {
  Shield,
  Search,
  ChevronRight,
  ArrowLeft,
  User,
  UserPlus,
  Star,
  Info
} from "lucide-react";
import { GuardRegistrationForm } from "./_components/guard-registration-form";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/table/pagination";

const countries = [
  { name: "Argentina", code: "ar", dialCode: "+54" },
  { name: "Bolivia", code: "bo", dialCode: "+591" },
  { name: "Brazil", code: "br", dialCode: "+55" },
  { name: "Canada", code: "ca", dialCode: "+1" },
  { name: "Chile", code: "cl", dialCode: "+56" },
  { name: "Colombia", code: "co", dialCode: "+57" },
  { name: "Ecuador", code: "ec", dialCode: "+593" },
  { name: "Guyana", code: "gy", dialCode: "+592" },
  { name: "Paraguay", code: "py", dialCode: "+595" },
  { name: "Peru", code: "pe", dialCode: "+51" },
  { name: "Suriname", code: "sr", dialCode: "+597" },
  { name: "United States", code: "us", dialCode: "+1" },
  { name: "Uruguay", code: "uy", dialCode: "+598" },
  { name: "Venezuela", code: "ve", dialCode: "+58" }
];

export default function GuardDirectoryPage() {
  const router = useRouter();
  const [guards, setGuards] = useState<any[]>([]);
  const [resendPasswordConfirm, setResendPasswordConfirm] = useState<{
    isOpen: boolean;
    guardId: string;
    guardName: string;
  }>({ isOpen: false, guardId: "", guardName: "" });
  const [isResendingPassword, setIsResendingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "register">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadGuards(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadGuards = async (page: number = 1) => {
    setIsLoading(true);
    const res = await clientFetchGuardsAction({
      page,
      search: searchQuery
    });
    if (res.success) {
      setGuards(res.data);
      setPagination(res.pagination);
      setCurrentPage(page);
    } else {
      toast.error(res.error || "Failed to load guards");
    }
    setIsLoading(false);
  };

  const handleResendPassword = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setResendPasswordConfirm({ isOpen: true, guardId: id, guardName: name });
  };

  const handleConfirmResendPassword = async () => {
    const id = resendPasswordConfirm.guardId;
    if (!id) return;
    setIsResendingPassword(true);
    const res = await clientResendGuardPasswordAction(id);

    if (res.success) {
      toast.success(res.message || "Password sent successfully");
    } else {
      toast.error(res.error || "Failed to resend password");
    }
    setIsResendingPassword(false);
    setResendPasswordConfirm({ isOpen: false, guardId: "", guardName: "" });
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Users Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guards</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guards Directory</h1>
        </div>
      </div>

      <div className="w-full">
        {view === "register" ? (
          <GuardRegistrationForm
            onBack={() => {
              setView("list");
              loadGuards(1);
            }}
            countries={countries}
          />
        ) : (
          <div>
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
              <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Shield className="w-5 h-5 text-[#0064cb]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Guards List</CardTitle>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">
                      {pagination?.total || guards.length} Registered Guards
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      placeholder="Search name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 pl-9 pr-4 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800"
                    />
                  </div>
                  <Button
                    onClick={() => setView("register")}
                    className="h-10 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 px-4 whitespace-nowrap cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add New Guard
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Name</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Guard Level
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Armed</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Unarmed</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Address</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="py-4 px-6 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} className="hover:bg-transparent border-slate-50">
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                                <Skeleton className="h-4 w-24 bg-slate-100" />
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-16 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-8 mx-auto bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-8 mx-auto bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-32 bg-slate-100" /></TableCell>
                            <TableCell className="py-4 px-4"><Skeleton className="h-4 w-12 bg-slate-100" /></TableCell>
                            <TableCell className="px-6 py-4 text-right"><Skeleton className="w-24 h-8 rounded-lg ml-auto bg-slate-50" /></TableCell>
                          </TableRow>
                        ))
                      ) : guards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-96 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Shield className="w-12 h-12 text-slate-200" />
                              <p className="text-sm font-medium text-slate-700">No guards found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        guards.map((guard) => (
                          <TableRow
                            key={guard.guard_id}
                            className="group hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer"
                            onClick={() => {
                              if (guard.application_id) {
                                router.push(`/guard-bank/${guard.application_id}`);
                              }
                            }}
                          >
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                  {guard.first_name || "---"} {guard.last_name || "---"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium">{guard.email}</span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium whitespace-nowrap">{guard.phone_number || "---"}</span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <div className="flex items-center gap-1">
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
                            <TableCell className="py-4 px-4 text-center">
                              <span className={cn(
                                "text-xs font-bold",
                                guard.armed ? "text-emerald-600" : "text-slate-700"
                              )}>
                                {guard.armed ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <span className={cn(
                                "text-xs font-bold",
                                guard.unarmed ? "text-emerald-600" : "text-slate-700"
                              )}>
                                {guard.unarmed ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium block truncate max-w-[150px]" title={guard.address}>
                                {guard.address || "---"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap",
                                guard.status
                                  ? "bg-green-50 text-green-600 border-green-200"
                                  : "bg-red-50 text-red-600 border-red-200"
                              )}>
                                {guard.status ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleResendPassword(e, guard.guard_id, `${guard.first_name || ""} ${guard.last_name || ""}`.trim())}
                                className="cursor-pointer h-8 text-[11px] font-bold text-[#0064cb] hover:text-[#0052ae] hover:bg-blue-50 transition-all border border-[#0064cb]/20 hover:border-[#0064cb]/40 rounded-lg px-3"
                              >
                                Resend Password
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {pagination && (
                  <Pagination
                    page={currentPage}
                    totalPages={pagination.total_pages || pagination.pages || 1}
                    totalItems={pagination.total}
                    limit={pagination.limit || 10}
                    onPageChange={loadGuards}
                    isPending={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <ConfirmationDialog
        isOpen={resendPasswordConfirm.isOpen}
        onClose={() => setResendPasswordConfirm({ isOpen: false, guardId: "", guardName: "" })}
        onConfirm={handleConfirmResendPassword}
        title="Are you sure?"
        description={`You are about to resend the password for guard ${resendPasswordConfirm.guardName}.`}
        confirmText="Yes"
        cancelText="Cancel"
        isDanger={false}
        isLoading={isResendingPassword}
      />
    </div>
  );
}
