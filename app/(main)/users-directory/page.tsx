"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  ChevronRight,
  ArrowLeft,
  User,
} from "lucide-react";
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
import { fetchMembersAction, deleteMemberAction } from "@/actions/auth.actions";
import Swal from "sweetalert2";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
import { MemberRegistrationForm } from "./_components/member-registration-form";

export default function MemberDirectoryPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "register">("list");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    const res = await fetchMembersAction();
    if (res.success) {
      setMembers(res.data || []);
    } else {
      toast.error(res.error || "Failed to load members");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to remove ${name} from the directory.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      width: "400px",
      padding: "2rem",
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3 px-6 rounded-xl transition-all mx-2 cursor-pointer",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all mx-2 cursor-pointer",
        popup: "rounded-[2rem] shadow-2xl border-none font-sans",
        title: "text-xl font-bold text-slate-800 !p-0 !m-0",
        htmlContainer: "text-slate-800 font-medium !p-0 !m-0 !mt-2",
        icon: "!mt-2 mb-2"
      }
    });

    if (result.isConfirmed) {
      const toastId = toast.loading("Deleting member...");
      const res = await deleteMemberAction(id);

      if (res.success) {
        toast.success(res.message, { id: toastId });
        loadMembers();
      } else {
        toast.error(res.error || "Failed to delete member", { id: toastId });
      }
    }
  };

  const filteredMembers = members.filter(member => {
    const search = searchQuery.toLowerCase();
    const fullName = `${member.first_name || ""} ${member.last_name || ""}`.toLowerCase();
    return (
      fullName.includes(search) ||
      (member.email || "").toLowerCase().includes(search)
    );
  });

  const limit = 10;
  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [searchQuery, totalPages, currentPage]);

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Users Directory</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Users Directory</h1>
        </div>
      </div>

      <div className="w-full">
        {view === "register" ? (
          <MemberRegistrationForm onBack={() => { setView("list"); loadMembers(); }} />
        ) : (
          <div>
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
              <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users className="w-5 h-5 text-[#0064cb]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Members List</CardTitle>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">
                      {total} Registered Members
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
                    <UserPlus className="w-4 h-4 mr-2" /> Add New Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto flex-1">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Name</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                        <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone Number</TableHead>
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
                            <TableCell className="px-6 py-4 text-right"><Skeleton className="w-9 h-9 rounded-lg ml-auto bg-slate-50" /></TableCell>
                          </TableRow>
                        ))
                      ) : paginatedMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-96 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Users className="w-12 h-12 text-slate-200" />
                              <p className="text-sm font-medium text-slate-700">No members found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedMembers.map((member) => (
                          <TableRow key={member.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {member.first_name || "---"} {member.last_name || "---"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium">{member.email}</span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <span className="text-xs text-slate-800 font-medium">{member.phone_number || "---"}</span>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(member.id, `${member.first_name || "---"} ${member.last_name || "---"}`)}
                                className="cursor-pointer w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              {totalPages > 0 && !isLoading && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  limit={limit}
                  onPageChange={setCurrentPage}
                  isPending={isLoading}
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
