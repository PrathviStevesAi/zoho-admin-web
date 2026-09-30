"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Users,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/app/(main)/guard-bank/components/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BenefitForm } from "./_components/benefit-form";
import {
  fetchMembershipsAction,
  createMembershipAction,
  deleteMembershipAction,
  MembershipBenefitItem,
} from "@/actions/membership.actions";

export interface Benefit {
  id: string;
  name: string;
  category: string;
  provider: string;
  assignedGuardsCount: number;
  assignedGuardNames?: string[];
  status: "Active" | "Inactive";
  description?: string;
  discountValue?: string;
  imageUrl?: string;
  website?: string;
  terms?: string;
  location?: string;
  startDate?: string;
  expiryDate?: string;
}

const DEFAULT_CATEGORIES = [
  "All Categories",
  "Gym",
  "Restaurant",
  "Apparel",
  "Healthcare",
  "Education",
  "Entertainment",
  "Travel",
  "Other",
];

const AVAILABLE_GUARDS = [
  { id: "g1", name: "John Doe", email: "john.doe@fastguard.com", phone: "+1 (555) 019-2831" },
  { id: "g2", name: "Marcus Vance", email: "marcus.v@fastguard.com", phone: "+1 (555) 012-4421" },
  { id: "g3", name: "Alex Rivera", email: "alex.r@fastguard.com", phone: "+1 (555) 017-8891" },
  { id: "g4", name: "David Miller", email: "david.m@fastguard.com", phone: "+1 (555) 014-9922" },
  { id: "g5", name: "Robert Chen", email: "robert.c@fastguard.com", phone: "+1 (555) 016-3382" },
  { id: "g6", name: "Sarah Jenkins", email: "sarah.j@fastguard.com", phone: "+1 (555) 018-1123" },
  { id: "g7", name: "Michael Scott", email: "michael.s@fastguard.com", phone: "+1 (555) 011-7744" },
  { id: "g8", name: "Jim Halpert", email: "jim.h@fastguard.com", phone: "+1 (555) 013-6655" },
  { id: "g9", name: "Dwight Schrute", email: "dwight.s@fastguard.com", phone: "+1 (555) 015-8833" },
  { id: "g10", name: "Stanley Hudson", email: "stanley.h@fastguard.com", phone: "+1 (555) 019-4466" },
  { id: "g11", name: "Kevin Malone", email: "kevin.m@fastguard.com", phone: "+1 (555) 012-3377" },
  { id: "g12", name: "Oscar Martinez", email: "oscar.m@fastguard.com", phone: "+1 (555) 017-2288" },
  { id: "g13", name: "Pam Beesly", email: "pam.b@fastguard.com", phone: "+1 (555) 014-5599" },
  { id: "g14", name: "Andy Bernard", email: "andy.b@fastguard.com", phone: "+1 (555) 016-7700" },
  { id: "g15", name: "Angela Martin", email: "angela.m@fastguard.com", phone: "+1 (555) 018-9911" },
];

function transformApiItem(item: MembershipBenefitItem): Benefit {
  const assignedGuards =
    typeof item.assigned_guards === "number"
      ? item.assigned_guards
      : Array.isArray(item.assigned_guards)
        ? item.assigned_guards.length
        : 0;

  const assignedGuardNames = Array.isArray(item.assigned_guards)
    ? item.assigned_guards.map((g) => (typeof g === "string" ? g : g?.name || String(g)))
    : [];

  const rawStatus = (item.status || "active").toLowerCase();
  const status: "Active" | "Inactive" = rawStatus === "inactive" ? "Inactive" : "Active";

  return {
    id: item.id || String(Math.random()),
    name: item.benefit_name || "Unnamed Benefit",
    category: item.category || "General",
    provider: item.business_partner_name || item.provider || "—",
    assignedGuardsCount: assignedGuards,
    assignedGuardNames,
    status,
    description: item.description || "",
    discountValue: item.discount_value || "",
    imageUrl: item.business_logo || item.image_url || "",
    location: item.location || "",
    startDate: item.start_date || item.startDate || "",
    expiryDate: item.expiry_date || item.expiryDate || "",
  };
}

export default function MembershipPage() {
  const router = useRouter();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsRefreshing] = useState(false);
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isAssignGuardsOpen, setIsAssignGuardsOpen] = useState(false);
  const [activeBenefitForGuards, setActiveBenefitForGuards] = useState<Benefit | null>(null);
  const [selectedGuardNames, setSelectedGuardNames] = useState<string[]>([]);
  const [guardSearchTerm, setGuardSearchTerm] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMemberships = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetchMembershipsAction();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(transformApiItem);
        setBenefits(mapped);
      } else {
        if (res.error) {
          toast.error(res.error);
        }
        setBenefits([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load benefits";
      toast.error(msg);
      setBenefits([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const categories = useMemo(() => {
    const fromData = Array.from(new Set(benefits.map((b) => b.category).filter(Boolean)));
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES.filter((c) => c !== "All Categories"), ...fromData]));
    return ["All Categories", ...merged];
  }, [benefits]);

  const filteredBenefits = useMemo(() => {
    return benefits.filter((b) => {
      if (activeTab === "active" && b.status !== "Active") return false;
      if (activeTab === "inactive" && b.status !== "Inactive") return false;
      if (
        selectedCategory !== "All Categories" &&
        b.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesProvider = b.provider.toLowerCase().includes(q);
        const matchesCategory = b.category.toLowerCase().includes(q);
        if (!matchesName && !matchesProvider && !matchesCategory) return false;
      }

      return true;
    });
  }, [benefits, activeTab, selectedCategory, searchQuery]);

  const totalCount = benefits.length;
  const activeCount = benefits.filter((b) => b.status === "Active").length;
  const inactiveCount = benefits.filter((b) => b.status === "Inactive").length;

  const handleOpenAdd = () => {
    setEditingBenefit(null);
    setView("add");
  };

  const handleOpenEdit = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setView("edit");
  };

  const handleSaveBenefitFromForm = async (data: {
    name: string;
    category: string;
    provider: string;
    status: "Active" | "Inactive";
    description: string;
    discountValue: string;
    assignedGuardsCount: number;
    assignedGuardNames: string[];
    imageUrl?: string;
    website?: string;
    terms?: string;
    location?: string;
    startDate?: string;
    expiryDate?: string;
  }) => {
    try {
      if (view === "edit" && editingBenefit) {
        setBenefits((prev) =>
          prev.map((b) =>
            b.id === editingBenefit.id
              ? {
                ...b,
                name: data.name,
                category: data.category,
                provider: data.provider,
                imageUrl: data.imageUrl || "",
                status: data.status,
                description: data.description,
                location: data.location || "",
                startDate: data.startDate || "",
                expiryDate: data.expiryDate || "",
              }
              : b
          )
        );
        toast.success("Membership updated successfully");
        setView("list");
        setEditingBenefit(null);
      } else {
        const res = await createMembershipAction({
          benefit_name: data.name,
          category: data.category,
          business_partner_name: data.provider,
          business_logo: data.imageUrl || "",
          description: data.description,
          location: data.location || "",
          start_date: data.startDate || "",
          expiry_date: data.expiryDate || "",
          status: data.status.toLowerCase(),
        });

        if (res.success) {
          toast.success(res.message || "Membership created successfully");
          const createdId =
            res.membership_id ||
            res.data?.membership_id ||
            res.data?.id ||
            res.data?.benefit_id ||
            res.data?.data?.id ||
            res.data?._id ||
            (typeof res.data === "string" ? res.data : null);

          if (createdId) {
            router.push(`/membership/${createdId}`);
          } else {
            setView("list");
            setEditingBenefit(null);
            await loadMemberships(true);
          }
        } else {
          toast.error(res.error || "Failed to create benefit");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    }
  };

  const handleOpenAssignGuards = (benefit: Benefit) => {
    setActiveBenefitForGuards(benefit);
    setSelectedGuardNames(benefit.assignedGuardNames || []);
    setGuardSearchTerm("");
    setIsAssignGuardsOpen(true);
  };

  const toggleGuardSelection = (guardName: string) => {
    setSelectedGuardNames((prev) =>
      prev.includes(guardName) ? prev.filter((name) => name !== guardName) : [...prev, guardName]
    );
  };

  const handleSaveAssignedGuards = async () => {
    if (!activeBenefitForGuards) return;
    setBenefits((prev) =>
      prev.map((b) =>
        b.id === activeBenefitForGuards.id
          ? {
            ...b,
            assignedGuardsCount: selectedGuardNames.length,
            assignedGuardNames: selectedGuardNames,
          }
          : b
      )
    );
    toast.success(`Guards updated for ${activeBenefitForGuards.name}`);
    setIsAssignGuardsOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!benefitToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteMembershipAction(benefitToDelete.id);
      if (res.success) {
        toast.success(res.message || `"${benefitToDelete.name}" deleted successfully`);
        setIsDeleteOpen(false);
        setBenefitToDelete(null);
        await loadMemberships(true);
      } else {
        toast.error(res.error || "Failed to delete membership benefit");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete benefit";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (view === "add" || view === "edit") {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto font-sans pb-12">
        <BenefitForm
          initialData={view === "edit" ? editingBenefit : null}
          onBack={() => {
            setView("list");
            setEditingBenefit(null);
          }}
          onSave={handleSaveBenefitFromForm}
        />
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">User Management</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Membership</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Membership & Benefits</h1>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                Manage guard benefits and memberships
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="h-10 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 px-4 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Benefit
          </Button>
        </div>
      </div>

      <div className="w-full">
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white flex flex-col !gap-0 !py-0">
          <div className="flex items-center gap-6 px-6 pt-5 border-b border-slate-100">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative cursor-pointer",
                activeTab === "all"
                  ? "text-[#0064cb] border-b-2 border-[#0064cb]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              All Benefits ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative cursor-pointer",
                activeTab === "active"
                  ? "text-[#0064cb] border-b-2 border-[#0064cb]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("inactive")}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative cursor-pointer",
                activeTab === "inactive"
                  ? "text-[#0064cb] border-b-2 border-[#0064cb]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          <div className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-slate-100">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
              <Input
                type="text"
                placeholder="Search benefit name, provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-4 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-x-auto overflow-y-auto max-h-[620px] flex-1">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">#</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Benefit Name</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Category</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Provider</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Assigned Guards</TableHead>
                    <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="py-4 px-6 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent border-slate-50">
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-4 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-32 bg-slate-100" />
                              <Skeleton className="h-3 w-16 bg-slate-50" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-20 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-24 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-16 bg-slate-100" />
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Skeleton className="h-4 w-12 bg-slate-100" />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Skeleton className="w-16 h-8 rounded-lg ml-auto bg-slate-50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredBenefits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-60 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Gift className="w-12 h-12 text-slate-200" />
                          <p className="text-sm font-medium text-slate-700">No benefits found</p>
                          <p className="text-xs text-slate-400">Try changing your filters or add a new benefit.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBenefits.map((benefit, index) => (
                      <TableRow
                        key={benefit.id}
                        onClick={() => router.push(`/membership/${benefit.id}`)}
                        className="group hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer"
                      >
                        <TableCell className="px-6 py-4">
                          <span className="text-xs text-slate-800 font-medium">{index + 1}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                              <Gift className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-700 whitespace-nowrap block">
                                {benefit.name}
                              </span>
                              {benefit.discountValue && (
                                <span className="block text-xs text-slate-500 font-normal mt-0.5">
                                  {benefit.discountValue}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="text-xs text-slate-800 font-medium">{benefit.category}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="text-xs text-slate-800 font-medium">{benefit.provider}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                            {benefit.assignedGuardsCount}{" "}
                            <span className="text-slate-500 font-normal">guards</span>
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap",
                              benefit.status === "Active"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            )}
                          >
                            {benefit.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBenefitToDelete(benefit);
                                setIsDeleteOpen(true);
                              }}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer shadow-xs border border-red-100"
                              title="Delete benefit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      <Dialog open={isAssignGuardsOpen} onOpenChange={setIsAssignGuardsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="size-5 text-[#0064cb]" />
              Assign Guards: {activeBenefitForGuards?.name}
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Select guards who are eligible for this membership benefit ({selectedGuardNames.length} selected).
            </p>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search guards by name or email..."
              value={guardSearchTerm}
              onChange={(e) => setGuardSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-72 border border-slate-100 rounded-lg divide-y divide-slate-100">
            {AVAILABLE_GUARDS.filter(
              (g) =>
                g.name.toLowerCase().includes(guardSearchTerm.toLowerCase()) ||
                g.email.toLowerCase().includes(guardSearchTerm.toLowerCase())
            ).map((guard) => {
              const isSelected = selectedGuardNames.includes(guard.name);
              return (
                <div
                  key={guard.id}
                  onClick={() => toggleGuardSelection(guard.name)}
                  className={cn(
                    "flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors",
                    isSelected && "bg-blue-50/50"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{guard.name}</p>
                    <p className="text-xs text-slate-500">{guard.email} &bull; {guard.phone}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }}
                    className="size-4 rounded text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAssignGuardsOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAssignedGuards}
              className="bg-[#0064cb] hover:bg-[#0052a8] text-white cursor-pointer"
            >
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setBenefitToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Benefit"
        description={`Are you sure you want to delete "${benefitToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}

