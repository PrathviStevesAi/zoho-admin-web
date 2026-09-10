"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Phone,
  Crown,
  User,
  Trash2,
  Check,
  X,
  MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { fetchStaffAction, deleteStaffAction, updateStaffRoleAction } from "@/actions/auth.actions";
import { MemberRegistrationForm } from "./_components/member-registration-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertCircle } from "lucide-react";

type TabType = "All Staff" | "Admins" | "Members";

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "register">("list");
  const [activeTab, setActiveTab] = useState<TabType>("All Staff");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    const res = await fetchStaffAction();
    if (res.success) {
      setStaff(res.data || []);
    } else {
      toast.error(res.error || "Failed to load staff");
    }
    setIsLoading(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setStaffToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteStaffAction(staffToDelete.id);
      if (res.success) {
        toast.success("Staff deleted successfully");
        setDeleteModalOpen(false);
        loadStaff();
      } else {
        toast.error(res.error || "Failed to delete staff");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRole = async (id: string) => {
    setIsUpdatingRole(true);
    const toastId = toast.loading("Updating role...");
    const res = await updateStaffRoleAction(id, selectedRole);

    if (res.success) {
      toast.success(res.message || "Role updated successfully!", { id: toastId });
      setStaff(prev => prev.map(m => m.id === id ? { ...m, role: selectedRole } : m));
      setEditingRoleId(null);
      
      if (session?.user?.id === id) {
        await updateSession({ role: selectedRole });
      }
    } else {
      toast.error(res.error || "Failed to update role", { id: toastId });
    }
    setIsUpdatingRole(false);
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      // Filter by tab
      if (activeTab === "Admins" && member.role !== "admin") return false;
      if (activeTab === "Members" && member.role !== "member") return false;
      return true;
    });
  }, [staff, activeTab]);

  const counts = useMemo(() => {
    const admins = staff.filter(m => m.role === "admin").length;
    const members = staff.filter(m => m.role === "member").length;
    return {
      all: staff.length,
      admins,
      members
    };
  }, [staff]);

    if (view === "register") {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
        <MemberRegistrationForm onBack={() => { setView("list"); loadStaff(); }} />
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-8 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Fastguard All Staff</h1>
            <p className="text-[14px] text-slate-500 font-medium">
              View and manage all staff members in your organization.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 mt-4">
        <div className="flex items-center gap-6 flex-1 overflow-x-auto pb-[1px]">
          <button
            onClick={() => setActiveTab("All Staff")}
            className={`cursor-pointer flex items-center gap-2 pb-3 px-1 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === "All Staff"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            All Staff
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "All Staff" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            }`}>
              {counts.all}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("Admins")}
            className={`cursor-pointer flex items-center gap-2 pb-3 px-1 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === "Admins"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Admins
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "Admins" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            }`}>
              {counts.admins}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("Members")}
            className={`cursor-pointer flex items-center gap-2 pb-3 px-1 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === "Members"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Members
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "Members" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            }`}>
              {counts.members}
            </span>
          </button>
        </div>
        <button
          onClick={() => setView("register")}
          className="h-[42px] bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-semibold shadow-md transition-all active:scale-95 px-6 whitespace-nowrap cursor-pointer flex items-center gap-2"
        >
          <UserPlus className="w-[18px] h-[18px]" />
          Add New Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-[12px] font-bold text-slate-600 uppercase tracking-wider w-[60px]">#</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-600 uppercase tracking-wider">Staff</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-600 uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-600 uppercase tracking-wider">Phone Number</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6">
                      <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                          <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-8 w-16 bg-slate-100 rounded animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="w-12 h-12 text-slate-200" />
                      <p className="text-[15px] font-medium text-slate-500">No staff members found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member, index) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6 text-[14px] font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                          <AvatarImage src={member.profile_img_url || undefined} alt={`${member.first_name} ${member.last_name}`} />
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-sm">
                            {(member.first_name?.[0] || "") + (member.last_name?.[0] || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {member.first_name || ""} {member.last_name || ""}
                          </span>
                          <span className="text-[13px] text-slate-500">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {editingRoleId === member.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedRole}
                            onValueChange={(value) => setSelectedRole(value)}
                            disabled={isUpdatingRole}
                          >
                            <SelectTrigger className="h-9 w-[110px] border-slate-200 focus:ring-[#0064cb]/20 rounded-full font-medium text-sm">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => handleSaveRole(member.id)}
                            disabled={isUpdatingRole}
                            className="text-green-500 hover:text-green-600 hover:bg-green-50 p-1 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                            title="Save Role"
                          >
                            <Check className="w-5 h-5" strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => setEditingRoleId(null)}
                            disabled={isUpdatingRole}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-5 h-5" strokeWidth={3} />
                          </button>
                        </div>
                      ) : member.role === "admin" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100">
                          <Crown className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-[12px] font-bold text-red-600 capitalize">Admin</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[12px] font-bold text-blue-600 capitalize">Member</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-[14px] font-medium">{member.phone_number || "---"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {(!member.action?.is_change_role && !member.action?.is_delete) ? (
                        <span className="text-slate-400 font-medium">---</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {member.action?.is_delete && (
                            <button
                              onClick={() => handleDeleteClick(member.id, `${member.first_name || ""} ${member.last_name || ""}`)}
                              disabled={isUpdatingRole}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {member.action?.is_change_role && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  disabled={isUpdatingRole}
                                  className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 outline-none"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 rounded-xl border-slate-200 shadow-lg">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingRoleId(member.id);
                                    setSelectedRole(member.role);
                                  }}
                                  className="text-green-600 font-semibold cursor-pointer focus:text-green-700 focus:bg-green-50 text-[13px] py-2 justify-center"
                                >
                                  Change Role
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-8 rounded-[24px]">
          <DialogHeader className="flex flex-col items-start text-left space-y-3">
            <div className="flex items-center justify-start gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 m-0">
                Delete Staff?
              </DialogTitle>
            </div>
            <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-700">{staffToDelete?.name}</span>? This action cannot be undone.
            </p>
          </DialogHeader>
          <div className="flex items-center gap-3 mt-6 w-full">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-[15px]"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-full bg-[#ff3b3b] hover:bg-[#e03535] text-white font-bold transition-colors shadow-[0_4px_14px_0_rgba(255,59,59,0.39)] disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2 text-[15px]"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, delete it"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

