"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  MoreVertical,
  Edit2,
  Calendar,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/app/(main)/guard-bank/components/confirmation-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  clientFetchPersonnelProfileByIdAction,
  clientUpdatePersonnelProfileByIdAction,
  clientDeletePersonnelProfileByIdAction,
  PersonnelProfileDetail,
  UpdatePersonnelProfilePayload,
} from "@/lib/client-actions";
import { PersonnelGuardsTable } from "./PersonnelGuardsTable";
import { PersonnelShiftsTable } from "./PersonnelShiftsTable";
import { PersonnelDocumentsTable } from "./PersonnelDocumentsTable";

const COUNTRIES = [
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
  { name: "Venezuela", code: "ve", dialCode: "+58" },
];

function parsePhoneWithCountry(rawPhone: string) {
  if (!rawPhone) return { country: COUNTRIES[11], number: "" };
  const cleaned = rawPhone.trim();

  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (cleaned.startsWith(c.dialCode)) {
      const rest = cleaned.slice(c.dialCode.length).trim().replace(/[^\d]/g, "");
      return { country: c, number: rest };
    }
  }
  const digits = cleaned.replace(/[^\d]/g, "");
  return { country: COUNTRIES[11], number: digits };
}

function formatPhoneDisplay(rawPhone?: string): string {
  if (!rawPhone || rawPhone === "---") return "---";
  const trimmed = rawPhone.trim().replace(/\s+/g, "");
  return trimmed || "---";
}

function countWords(str?: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

interface ProviderDetailViewProps {
  type: string;
  id: string;
}

export function ProviderDetailView({ type, id }: ProviderDetailViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PersonnelProfileDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type DetailTab = "general" | "guards" | "shifts" | "documents";
  const [activeTab, setActiveTab] = useState<DetailTab>("general");
  const [guardsCount, setGuardsCount] = useState<number | undefined>(undefined);
  const [shiftsCount, setShiftsCount] = useState<number | undefined>(undefined);
  const [documentsCount, setDocumentsCount] = useState<number | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(COUNTRIES[11]);
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phoneDigits: "",
    phoneCountryCode: "us",
    street: "",
    zip: "",
    country: "",
    state: "",
    city: "",
    notes: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isAgent = type === "agent";
  const entityLabel = isAgent ? "Agent" : "Agency";
  const parentDirectoryPath = `/provider-management/${type}`;
  const parentDirectoryLabel = isAgent ? "Agents" : "Agencies";

  const initEditFormData = (p: PersonnelProfileDetail) => {
    const rawPhone = p.phone_no || p.phone || p.phone_number || "";
    const parsed = parsePhoneWithCountry(rawPhone);
    return {
      name: p.name || "",
      email: p.email || "",
      phoneDigits: parsed.number,
      phoneCountryCode: parsed.country.code,
      street: p.address?.street || "",
      zip: p.address?.zip || p.address?.zip_code || "",
      country: p.address?.country || "",
      state: p.address?.state || "",
      city: p.address?.city || "",
      notes: p.notes || "",
    };
  };

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await clientFetchPersonnelProfileByIdAction(id);
      if (res.success && res.data) {
        setProfile(res.data);
        if (typeof res.data.total_guards === "number") {
          setGuardsCount(res.data.total_guards);
        }
        const initData = initEditFormData(res.data);
        setEditForm(initData);
        const countryObj = COUNTRIES.find((c) => c.code === initData.phoneCountryCode) || COUNTRIES[11];
        setSelectedPhoneCountry(countryObj);
      } else {
        setError(res.error || `Failed to load ${entityLabel.toLowerCase()} details`);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const initialValues = profile ? initEditFormData(profile) : null;
  const initialPhoneFormatted =
    initialValues && initialValues.phoneDigits
      ? `${COUNTRIES.find((c) => c.code === initialValues.phoneCountryCode)?.dialCode || "+1"}${initialValues.phoneDigits}`
      : "";
  const currentPhoneFormatted = editForm.phoneDigits.trim()
    ? `${selectedPhoneCountry.dialCode}${editForm.phoneDigits.trim()}`
    : "";

  const hasChanges = Boolean(
    initialValues &&
    (editForm.name.trim() !== initialValues.name.trim() ||
      editForm.email.trim() !== initialValues.email.trim() ||
      currentPhoneFormatted !== initialPhoneFormatted ||
      editForm.street.trim() !== initialValues.street.trim() ||
      editForm.zip.trim() !== initialValues.zip.trim() ||
      editForm.country.trim() !== initialValues.country.trim() ||
      editForm.state.trim() !== initialValues.state.trim() ||
      editForm.city.trim() !== initialValues.city.trim() ||
      editForm.notes.trim() !== initialValues.notes.trim())
  );

  const handleEditChange = (field: string, value: string) => {
    if (field === "notes") {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length > 500) {
        const truncated = value.split(/\s+/).slice(0, 500).join(" ");
        setEditForm((prev) => ({ ...prev, notes: truncated }));
        toast.warning("Word limit reached: maximum 500 words allowed");
        return;
      }
    }
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleTabChange = (newTab: DetailTab) => {
    if (isEditing && hasChanges) {
      if (!window.confirm("You have unsaved changes. Discard changes and switch tab?")) {
        return;
      }
    }
    if (isEditing) {
      handleCancelEdit();
    }
    setActiveTab(newTab);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormErrors({});
    setIsPhoneDropdownOpen(false);
    if (profile) {
      const initData = initEditFormData(profile);
      setEditForm(initData);
      const countryObj = COUNTRIES.find((c) => c.code === initData.phoneCountryCode) || COUNTRIES[11];
      setSelectedPhoneCountry(countryObj);
    }
  };

  const handleSaveEdit = async () => {
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = `${entityLabel} Name is required`;
    if (!editForm.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    if (!editForm.country.trim()) errors.country = "Country is required";
    if (!editForm.state.trim()) errors.state = "State is required";
    if (!editForm.city.trim()) errors.city = "City is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields properly");
      return;
    }

    setFormErrors({});
    setIsSavingEdit(true);

    try {
      const payloadPhone = editForm.phoneDigits.trim()
        ? `${selectedPhoneCountry.dialCode}${editForm.phoneDigits.trim()}`
        : undefined;

      const payload: UpdatePersonnelProfilePayload = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: payloadPhone,
        address: {
          street: editForm.street.trim() || undefined,
          zip: editForm.zip.trim() || undefined,
          country: editForm.country.trim(),
          state: editForm.state.trim(),
          city: editForm.city.trim(),
        },
        notes: editForm.notes.trim() || undefined,
      };

      const res = await clientUpdatePersonnelProfileByIdAction(id, payload);
      if (res.success) {
        toast.success(res.message || `${entityLabel} updated successfully`);
        setIsEditing(false);
        setIsPhoneDropdownOpen(false);
        await loadProfile();
      } else {
        toast.error(res.error || `Failed to update ${entityLabel.toLowerCase()}`);
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to update ${entityLabel.toLowerCase()}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await clientDeletePersonnelProfileByIdAction(id);
      if (res.success) {
        toast.success(res.message || `${entityLabel} deleted successfully`);
        setIsDeleteModalOpen(false);
        router.push(parentDirectoryPath);
      } else {
        toast.error(res.error || `Failed to delete ${entityLabel.toLowerCase()}`);
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to delete ${entityLabel.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 bg-slate-100" />
            <Skeleton className="h-3 w-3 rounded-full bg-slate-100" />
            <Skeleton className="h-4 w-28 bg-slate-100" />
            <Skeleton className="h-3 w-3 rounded-full bg-slate-100" />
            <Skeleton className="h-4 w-24 bg-slate-100" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
              <Skeleton className="h-8 w-48 bg-slate-100" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg bg-slate-100" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-2xl bg-slate-100 shrink-0" />
          <div className="space-y-3 flex-1 w-full text-center sm:text-left">
            <Skeleton className="h-7 w-56 mx-auto sm:mx-0 bg-slate-100" />
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Skeleton className="h-5 w-32 bg-slate-100" />
              <Skeleton className="h-5 w-28 bg-slate-100" />
              <Skeleton className="h-5 w-36 bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <Skeleton className="h-5 w-40 bg-slate-100" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24 bg-slate-100" />
                <Skeleton className="h-5 w-36 bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 text-slate-700 text-[13px]">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={parentDirectoryPath} className="hover:text-[#0064cb] transition-colors">
            {parentDirectoryLabel}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Details</span>
        </div>

        <Card className="border border-red-100 shadow-md rounded-2xl p-8 bg-white text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {error || `${entityLabel} not found`}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Unable to load the requested {entityLabel.toLowerCase()} profile.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(parentDirectoryPath)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to {parentDirectoryLabel}
            </Button>
            <Button
              onClick={loadProfile}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const IconComp = isAgent ? UserCheck : Building2;
  const rawPhoneNumber = profile.phone_no || profile.phone || profile.phone_number || "---";
  const displayPhoneNumber = formatPhoneDisplay(rawPhoneNumber);

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors whitespace-nowrap">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={parentDirectoryPath} className="hover:text-[#0064cb] transition-colors whitespace-nowrap">
            Provider Management
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={parentDirectoryPath} className="hover:text-[#0064cb] transition-colors whitespace-nowrap">
            {parentDirectoryLabel}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-slate-600 font-medium whitespace-nowrap">
            {entityLabel} Details
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={parentDirectoryPath}
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {entityLabel} Details
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isEditing && (
              <div className="hidden sm:flex items-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 h-10 rounded-md font-semibold text-sm border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !hasChanges}
                  className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-6 py-2.5 h-10 rounded-md font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  {isSavingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </div>
            )}

            {activeTab === "general" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border-none shadow-sm cursor-pointer flex items-center justify-center"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 p-1.5 rounded-xl border-slate-100 shadow-xl bg-white text-slate-700 font-medium text-[13px]"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("general");
                      if (profile) {
                        const initData = initEditFormData(profile);
                        setEditForm(initData);
                        const countryObj = COUNTRIES.find((c) => c.code === initData.phoneCountryCode) || COUNTRIES[11];
                        setSelectedPhoneCountry(countryObj);
                        setFormErrors({});
                      }
                      setIsEditing(true);
                    }}
                    className="cursor-pointer gap-2 py-2.5 focus:bg-slate-50 focus:text-slate-900 rounded-lg text-slate-700"
                  >
                    <Edit2 className="w-4 h-4 text-[#0064cb]" />
                    <span>Edit Details</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="cursor-pointer gap-2 py-2.5 focus:bg-red-50 focus:text-red-600 rounded-lg text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex sm:hidden items-center justify-end gap-2 w-full pt-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSavingEdit}
              className="flex-1 h-10 rounded-md font-semibold text-sm border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !hasChanges}
              className="flex-1 bg-[#0064cb] hover:bg-[#0052ae] text-white h-10 rounded-md font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSavingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-center text-[#0064cb] shadow-sm">
            <IconComp className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
        </div>

        <div className="space-y-2 flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left w-full overflow-hidden">
          <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 break-words break-all max-w-full">
            {profile.name || "Unnamed Profile"}
          </h2>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-slate-600 font-medium pt-1 max-w-full overflow-hidden">
            {profile.email && (
              <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-800 break-all">{profile.email}</span>
              </div>
            )}

            {displayPhoneNumber !== "---" && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-800">{displayPhoneNumber}</span>
              </div>
            )}

            {(profile.address?.city || profile.address?.country || profile.address?.street) && (
              <div className="flex items-start sm:items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                <span
                  className="text-slate-800 break-words break-all text-xs"
                  title={[profile.address?.street, profile.address?.city, profile.address?.state, profile.address?.country]
                    .filter(Boolean)
                    .join(", ")}
                >
                  {[profile.address?.street, profile.address?.city, profile.address?.state, profile.address?.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6">
        <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none">
          <button
            type="button"
            onClick={() => handleTabChange("general")}
            className={cn(
              "cursor-pointer flex items-center gap-2 pb-3 pt-1 px-1 text-sm transition-all whitespace-nowrap -mb-px border-b-2 shrink-0",
              activeTab === "general"
                ? "border-[#0064cb] text-[#0064cb] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-semibold"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>General Information</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("guards")}
            className={cn(
              "cursor-pointer flex items-center gap-2 pb-3 pt-1 px-1 text-sm transition-all whitespace-nowrap -mb-px border-b-2 shrink-0",
              activeTab === "guards"
                ? "border-[#0064cb] text-[#0064cb] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-semibold"
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Guards</span>
            {typeof guardsCount === "number" && (
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  activeTab === "guards"
                    ? "bg-blue-100 text-[#0064cb]"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {guardsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("shifts")}
            className={cn(
              "cursor-pointer flex items-center gap-2 pb-3 pt-1 px-1 text-sm transition-all whitespace-nowrap -mb-px border-b-2 shrink-0",
              activeTab === "shifts"
                ? "border-[#0064cb] text-[#0064cb] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-semibold"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Shifts</span>
            {typeof shiftsCount === "number" && (
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  activeTab === "shifts"
                    ? "bg-blue-100 text-[#0064cb]"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {shiftsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("documents")}
            className={cn(
              "cursor-pointer flex items-center gap-2 pb-3 pt-1 px-1 text-sm transition-all whitespace-nowrap -mb-px border-b-2 shrink-0",
              activeTab === "documents"
                ? "border-[#0064cb] text-[#0064cb] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-semibold"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
            {typeof documentsCount === "number" && (
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  activeTab === "documents"
                    ? "bg-blue-100 text-[#0064cb]"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {documentsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "general" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-7 space-y-7 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0064cb]">
              <Building2 className="w-4 h-4" />
              <h3 className="font-bold text-slate-800 text-[14px]">General Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-6">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  {entityLabel} Name {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing ? (
                  <>
                    <Input
                      value={editForm.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      placeholder={`Enter ${entityLabel} Name`}
                      className={cn(
                        "h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]",
                        formErrors.name && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formErrors.name}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.name || "N/A"}
                  </p>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Email Address {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing ? (
                  <>
                    <Input
                      value={editForm.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                      placeholder="Enter Email Address"
                      className={cn(
                        "h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]",
                        formErrors.email && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formErrors.email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.email || "N/A"}
                  </p>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Phone Number
                </span>
                {isEditing ? (
                  <div className="relative flex items-center h-10 bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-[#0064cb]/20 focus-within:border-[#0064cb] transition-all shadow-xs">
                    <button
                      type="button"
                      onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 h-full rounded-l-md hover:bg-slate-50 border-r border-slate-200 transition-colors focus:outline-none cursor-pointer bg-slate-50/50 shrink-0"
                    >
                      <img
                        src={`https://flagcdn.com/w20/${selectedPhoneCountry.code}.png`}
                        alt={selectedPhoneCountry.name}
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                      />
                      <span className="text-sm font-semibold text-slate-700">{selectedPhoneCountry.dialCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <div className="relative flex-1 h-full flex items-center min-w-0">
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={editForm.phoneDigits}
                        maxLength={15}
                        onChange={(e) => handleEditChange("phoneDigits", e.target.value.replace(/\D/g, ""))}
                        className="w-full h-full bg-white outline-none border-none pl-3 pr-3 text-slate-900 font-medium placeholder:text-muted-foreground text-sm rounded-r-md"
                      />
                    </div>
                    {isPhoneDropdownOpen && (
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsPhoneDropdownOpen(false)}
                      />
                    )}
                    {isPhoneDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedPhoneCountry(c);
                              setIsPhoneDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <img
                              src={`https://flagcdn.com/w20/${c.code}.png`}
                              alt={c.name}
                              className="w-5 h-3.5 object-cover rounded-sm"
                            />
                            <span className="text-sm font-medium text-slate-700 flex-1">{c.name}</span>
                            <span className="text-xs font-bold text-slate-500">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {displayPhoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0064cb]">
              <MapPin className="w-4 h-4" />
              <h3 className="font-bold text-slate-800 text-[14px]">Address & Location</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-6">
              <div className="space-y-1 sm:col-span-2 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Street Address
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.street}
                    onChange={(e) => handleEditChange("street", e.target.value)}
                    placeholder="Enter Street Address"
                    className="h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]"
                  />
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.address?.street || "N/A"}
                  </p>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Zip / Postal Code
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.zip}
                    maxLength={10}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, "");
                      handleEditChange("zip", sanitized);
                    }}
                    placeholder="Enter Zip Code"
                    className="h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]"
                  />
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.address?.zip || profile.address?.zip_code || "N/A"}
                  </p>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Country {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing ? (
                  <>
                    <Input
                      value={editForm.country}
                      onChange={(e) => handleEditChange("country", e.target.value)}
                      placeholder="Enter Country"
                      className={cn(
                        "h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]",
                        formErrors.country && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {formErrors.country && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formErrors.country}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.address?.country || "N/A"}
                  </p>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  State / Province {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing ? (
                  <>
                    <Input
                      value={editForm.state}
                      onChange={(e) => handleEditChange("state", e.target.value)}
                      placeholder="Enter State / Province"
                      className={cn(
                        "h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]",
                        formErrors.state && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {formErrors.state && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formErrors.state}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.address?.state || "N/A"}
                  </p>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  City {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing ? (
                  <>
                    <Input
                      value={editForm.city}
                      onChange={(e) => handleEditChange("city", e.target.value)}
                      placeholder="Enter City"
                      className={cn(
                        "h-10 text-sm rounded-md bg-white border-slate-200 text-slate-900 shadow-xs focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 focus-visible:ring-offset-0 focus-visible:border-[#0064cb]",
                        formErrors.city && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {formErrors.city && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formErrors.city}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] font-bold text-slate-800 break-words break-all">
                    {profile.address?.city || "N/A"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0064cb]">
              <FileText className="w-4 h-4" />
              <h3 className="font-bold text-slate-800 text-[14px]">Notes & Additional Details</h3>
            </div>
            {isEditing ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold block">
                    Notes & Details (Optional)
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      countWords(editForm.notes) >= 500
                        ? "text-amber-600 font-bold"
                        : "text-slate-400"
                    )}
                  >
                    {countWords(editForm.notes)} / 500 words
                  </span>
                </div>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => handleEditChange("notes", e.target.value)}
                  rows={4}
                  placeholder={`Enter any additional notes or details regarding operations, coverage, contracts, or contacts for this ${entityLabel.toLowerCase()}...`}
                  className="w-full min-h-[120px] rounded-md border border-slate-200 bg-white p-3.5 text-sm text-slate-900 font-medium placeholder:text-muted-foreground placeholder:text-sm placeholder:font-normal focus:outline-none focus:border-[#0064cb] focus:ring-2 focus:ring-[#0064cb]/20 transition-all resize-y shadow-xs"
                />
              </div>
            ) : profile.notes ? (
              <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words break-all pl-6">
                {profile.notes}
              </p>
            ) : (
              <p className="text-[13px] text-slate-400 italic pl-6">
                No notes available
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "guards" && (
        <div className="animate-in fade-in duration-300">
          <PersonnelGuardsTable
            profileId={id}
            entityLabel={entityLabel}
            onCountChange={(count) => setGuardsCount(count)}
          />
        </div>
      )}

      {activeTab === "shifts" && (
        <div className="animate-in fade-in duration-300">
          <PersonnelShiftsTable
            profileId={id}
            entityLabel={entityLabel}
            onCountChange={(count) => setShiftsCount(count)}
          />
        </div>
      )}

      {activeTab === "documents" && (
        <div className="animate-in fade-in duration-300">
          <PersonnelDocumentsTable
            profileId={id}
            entityLabel={entityLabel}
            onCountChange={(count) => setDocumentsCount(count)}
          />
        </div>
      )}

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${entityLabel}`}
        description={`Are you sure you want to delete this ${entityLabel.toLowerCase()} (${profile.name})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
