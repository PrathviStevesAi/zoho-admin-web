"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Lock,
  Trash2,
  Search,
  ChevronRight,
  ArrowLeft,
  User,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { useEffect } from "react";
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
import { registerUserAction, fetchMembersAction, deleteMemberAction } from "@/actions/auth.actions";
import Swal from "sweetalert2";
import { Skeleton } from "@/components/ui/skeleton";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function MemberDirectoryPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: ""
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsRegistering(true);
    const res = await registerUserAction({
      email: formData.email,
      password: formData.password,
      role: "member",
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phone
    });

    console.log("Register Action Response:", res);

    if (res.success) {
      toast.success("Member registered successfully");
      setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "" });
      loadMembers();
    } else {
      toast.error(res.error || "Registration failed");
    }
    setIsRegistering(false);
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

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumbs & Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Member Directory</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Member Directory</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-5">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Register New Member</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">First Name</label>
                    <Input
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Last Name</label>
                    <Input
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex justify-between items-center">
                    <span>Phone Number</span>
                    <span className="text-[10px] lowercase text-slate-700 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Access Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 pl-11 pr-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full h-12 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 mt-2 disabled:opacity-70"
                >
                  {isRegistering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering...</span>
                    </div>
                  ) : "Register Member"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Member List */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white min-h-[600px]">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Members List</CardTitle>
                  <p className="text-xs text-slate-800 font-medium mt-0.5">{members.length} Registered Members</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[200px] h-12 px-8 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Name</TableHead>
                      <TableHead className="h-12 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                      <TableHead className="h-12 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone Number</TableHead>
                      <TableHead className="h-12 text-right px-8 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent border-slate-50">
                          <TableCell className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-9 h-9 rounded-full bg-slate-100" />
                              <Skeleton className="h-4 w-32 bg-slate-100" />
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Skeleton className="h-4 w-48 bg-slate-100" />
                          </TableCell>
                          <TableCell className="py-4">
                            <Skeleton className="h-4 w-32 bg-slate-100" />
                          </TableCell>
                          <TableCell className="px-8 py-4 text-right">
                            <Skeleton className="w-9 h-9 rounded-lg ml-auto bg-slate-50" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-10 h-10 text-slate-200" />
                            <p className="text-sm font-medium text-slate-700 italic">No members found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                <User className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">
                                {member.first_name} {member.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-slate-800 font-medium">{member.email}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-slate-800 font-medium">{member.phone_number || "---"}</span>
                          </TableCell>
                          <TableCell className="px-8 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(member.id, `${member.first_name} ${member.last_name}`)}
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
          </Card>
        </div>
      </div>
    </div>
  );
}
