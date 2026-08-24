"use client";

import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "../components/confirmation-dialog";
import { BadgeCreateDialog } from "../components/badge-create-dialog";
import { Country, State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "../../../subcontractor/components/StaticData";

const ALLOWED_COUNTRIES = ["US", "CA", "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"];
import { BadgeViewDialog } from "../components/badge-view-dialog";
import { ApproveGuardDialog } from "../components/approve-guard-dialog";
import { DeclineGuardDialog } from "../components/decline-guard-dialog";
import { GuardPageSkeleton } from "../components/guard-page-skeleton";
import { GuardHeader } from "../components/guard-header";
import { GuardProfileSummary } from "../components/guard-profile-summary";
import { GuardPersonalDetails, GuardContactInfo, GuardPreferences } from "../components/guard-information";
import { GuardAddress } from "../components/guard-address";
import { GuardDocuments } from "../components/guard-documents";
import { GuardNotesAndBadge } from "../components/guard-notes-and-badge";

const phoneCountries = [
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

export default function GuardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [guard, setGuard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [isDeletingBadge, setIsDeletingBadge] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isUpdateLevelModalOpen, setIsUpdateLevelModalOpen] = useState(false);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingDocs, setDeletingDocs] = useState<Record<string, boolean>>({});
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [localFileNames, setLocalFileNames] = useState<Record<string, string>>({});

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    const allCountries = Country.getAllCountries().filter(c => ALLOWED_COUNTRIES.includes(c.isoCode));
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    if (editForm.country === "US") {
      const usStates = Object.entries(US_STATE_CITY_DATA).map(([name, data]) => ({
        isoCode: data.short_code,
        name: name,
      }));
      setStates(usStates);
    } else if (editForm.country) {
      setStates(State.getStatesOfCountry(editForm.country));
    } else {
      setStates([]);
    }
  }, [editForm.country]);

  useEffect(() => {
    if (editForm.country === "US" && editForm.state) {
      const stateData = Object.values(US_STATE_CITY_DATA).find(s => s.short_code === editForm.state);
      if (stateData) {
        const usCities = stateData.cities.map(city => ({ name: city }));
        setCities(usCities);
      } else {
        setCities([]);
      }
    } else if (editForm.country && editForm.state) {
      setCities(City.getCitiesOfState(editForm.country, editForm.state));
    } else {
      setCities([]);
    }
  }, [editForm.state, editForm.country]);

  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(phoneCountries[11]);
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);

  useEffect(() => {
    if (guard?.phone_number) {
      let matchingCountry;

      if (guard.country) {
        matchingCountry = phoneCountries.find(c =>
          c.code.toLowerCase() === guard.country.toLowerCase() &&
          guard.phone_number.startsWith(c.dialCode)
        );
      }

      if (!matchingCountry) {
        matchingCountry = phoneCountries.find(c => c.code === "us" && guard.phone_number.startsWith(c.dialCode))
          || phoneCountries.find(c => guard.phone_number.startsWith(c.dialCode));
      }

      if (matchingCountry) {
        setSelectedPhoneCountry(matchingCountry);
      }
    }
  }, [guard]);

  const handleEditChange = (field: string, value: any, localFile?: File) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
    if (localFile) {
      setLocalPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(localFile) }));
      setLocalFileNames(prev => ({ ...prev, [field]: localFile.name }));
    } else if (value === null) {
      setLocalPreviews(prev => ({ ...prev, [field]: "" }));
      setLocalFileNames(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSaveEdit = async () => {
    const allowedKeys = [
      "phone_number", "guard_level", "license_number", "license_expiration_date",
      "resume_url", "headshot_image_url", "security_guard_license_url", "driver_license_url",
      "firewatch_certificate_url", "verification_video_url", "first_name", "last_name",
      "street_address", "country", "state", "city", "zip_code", "referral", "on_call",
      "smartphone", "job_alerts", "license", "background", "transport", "unarmed", "armed",
      "english_language", "gender", "ethnicity", "veteran_status", "disability_status", "notes"
    ];

    const payload: any = {};
    Object.keys(editForm).forEach(key => {
      if (editForm[key] !== guard[key] && allowedKeys.includes(key)) {
        if (key === "phone_number" && typeof editForm[key] === "string") {
          payload[key] = editForm[key].replace(/\s/g, "");
        } else {
          payload[key] = editForm[key];
        }
      }
    });
    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    console.log("PATCH Payload:", payload);

    setIsSavingEdit(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${guard.id}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const responseData = await res.json().catch(() => ({}));
        console.log("PATCH Response Success:", responseData);
        toast.success(responseData.message || "Application updated successfully");
        setIsEditing(false);
        fetchGuardDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        console.log("PATCH Response Error:", data);
        toast.error(getErrorMessage(data, "Failed to update application"));
      }
    } catch (error) {
      toast.error("An error occurred while updating the application");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchGuardDetails = async () => {
    setLoading(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGuard(data.data);
        setNotes(data.data.notes || data.data.admin_notes || "");
      } else {
        toast.error("Failed to fetch guard details");
        router.push("/guard-bank");
      }
    } catch (error) {
      console.error("Failed to fetch guard details:", error);
      toast.error("An error occurred while fetching details");
      router.push("/guard-bank");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGuardDetails();
    }
  }, [id]);

  const handleUpdateStatus = async (newStatus: "approved" | "disqualified", level?: number): Promise<boolean> => {
    setIsUpdatingStatus(newStatus);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      let url = `${baseUrl}/api/v1/guard/bank/application/${id}/status/${newStatus}`;

      const payload: any = {};
      if (newStatus === "approved" && level) {
        url += `?guard_level=${level}`;
        payload.guard_level = level;
      }

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Application ${newStatus === "approved" ? "Approved" : "Declined"} successfully`);
        router.push(`/guard-bank?tab=${getTabParam()}`);
        return true;
      } else {
        toast.error(getErrorMessage(data, `Failed to update status to ${newStatus}`));
        return false;
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("An error occurred while updating status");
      return false;
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleUpdateLevel = async (level: number) => {
    setIsUpdatingLevel(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${guard.id}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ guard_level: level })
      });

      if (res.ok) {
        const responseData = await res.json().catch(() => ({}));
        toast.success(responseData.message || "Guard level updated successfully");
        setIsUpdateLevelModalOpen(false);
        fetchGuardDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(getErrorMessage(data, "Failed to update guard level"));
      }
    } catch (error) {
      toast.error("An error occurred while updating the guard level");
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  const handleDeleteDocument = async (documentKey: string, field: string) => {
    try {
      setDeletingDocs(prev => ({ ...prev, [documentKey]: true }));
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${baseUrl}/api/v1/guard/${id}/${documentKey}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (res.ok) {
        toast.success("Document deleted successfully");
        setGuard((prev: any) => ({ ...prev, [field]: null }));
        setEditForm((prev: any) => ({ ...prev, [field]: null }));
        setLocalPreviews((prev: any) => ({ ...prev, [field]: "" }));
        setLocalFileNames((prev: any) => ({ ...prev, [field]: "" }));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(getErrorMessage(data, "Failed to delete document"));
      }
    } catch (err) {
      toast.error("An error occurred while deleting document");
    } finally {
      setDeletingDocs(prev => ({ ...prev, [documentKey]: false }));
    }
  };

  const handleDeleteApplication = async () => {
    setIsDeleting(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (res.ok) {
        toast.success("Guard application deleted successfully");
        setDeleteConfirmOpen(false);
        router.push(`/guard-bank?tab=${getTabParam()}`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(getErrorMessage(data, "Failed to delete guard application"));
      }
    } catch (error) {
      console.error("Failed to delete guard:", error);
      toast.error("An error occurred while deleting the guard application");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/bank/application/${id}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ notes })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log("Notes saved successfully");
      } else {
        console.error("Failed to save notes:", data.message || data.detail);
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("An error occurred while saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateBadgeSubmit = async (formData: FormData): Promise<boolean> => {
    setIsGeneratingBadge(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/guard/fastguard-badge`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Badge ID created successfully!");
        fetchGuardDetails();
        return true;
      } else {
        toast.error(getErrorMessage(data, "Failed to create badge ID"));
        return false;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while creating the badge ID");
      return false;
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  const handleDeleteBadge = async () => {
    setIsDeletingBadge(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const deleteUrl = `${baseUrl}/api/v1/guard/${id}/fastguard-badge`;

      const deleteRes = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!deleteRes.ok) {
        const errData = await deleteRes.json().catch(() => ({}));
        throw new Error(getErrorMessage(errData, "Failed to delete badge ID"));
      }

      toast.success("Badge ID deleted successfully");
      setIsViewModalOpen(false);
      fetchGuardDetails();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete badge ID");
    } finally {
      setIsDeletingBadge(false);
    }
  };

  const handleDownloadBadge = async () => {
    if (!guard.guard_badge_url) return;
    try {
      const res = await fetch(guard.guard_badge_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${guard.first_name || "guard"}_badge.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Badge downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download badge image");
    }
  };

  if (loading) {
    return <GuardPageSkeleton />;
  }

  if (!guard) return null;

  const getBadgeValue = (val: any) => {
    const isTrue = val === true || val === "yes";
    return (
      <span className={cn(
        "px-2.5 py-1 rounded-full text-xs font-bold shadow-sm inline-block",
        isTrue ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
      )}>
        {isTrue ? "Yes" : "No"}
      </span>
    );
  };

  const getErrorMessage = (data: any, fallback: string): string => {
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (data.detail !== undefined && data.detail !== null) {
      if (typeof data.detail === "string") return data.detail;
      if (typeof data.detail.error === "string") return data.detail.error;
      if (typeof data.detail.message === "string") return data.detail.message;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
      return JSON.stringify(data.detail);
    }
    if (data.error !== undefined && data.error !== null) {
      if (typeof data.error === "string") return data.error;
      if (typeof data.error.message === "string") return data.error.message;
      return JSON.stringify(data.error);
    }
    if (typeof data.message === "string") return data.message;

    return fallback;
  };

  const getDocumentFilename = (url?: string) => {
    if (!url) return "Document";
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last).substring(0, 30) + (last.length > 30 ? "..." : "");
  };

  const getStatusBreadcrumb = () => {
    if (!guard) return "";
    switch (guard.status) {
      case "record_touched": return "Record Touched";
      case "approved": return "Approved";
      case "disqualified": return "Disqualified";
      case "pending": return "Home";
      default: return "Home";
    }
  };

  const getTabParam = () => {
    if (!guard) return "home";
    switch (guard.status) {
      case "record_touched": return "record-touch";
      case "approved": return "approved";
      case "disqualified": return "disqualified";
      default: return "home";
    }
  };

  const getLevelBadge = (level: number) => {
    let config = { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", color: "#64748b", label: "Unknown Level" };
    if (level === 1) config = { bg: "bg-green-50/70", border: "border-green-200", text: "text-green-700", color: "#22c55e", label: "Entry Level" };
    else if (level === 2) config = { bg: "bg-orange-50/70", border: "border-orange-200", text: "text-amber-600", color: "#f59e0b", label: "Intermediate Level" };
    else if (level === 3) config = { bg: "bg-purple-50/70", border: "border-purple-200", text: "text-purple-700", color: "#8b5cf6", label: "Senior Level" };

    return (
      <div className={`inline-flex items-center gap-3 ${config.bg} border ${config.border} px-4 py-2 rounded-xl`}>
        <div className="relative flex items-center justify-center w-[28px] h-[28px]">
          <svg className="absolute w-[28px] h-[28px]" viewBox="0 0 24 24" fill={config.color} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <svg className="relative z-10 w-[14px] h-[14px] text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className={`text-[13px] ${config.text} font-bold leading-tight tracking-wide`}>LEVEL {level}</span>
          <span className="text-[12px] text-slate-500 font-medium leading-tight">{config.label}</span>
        </div>
      </div>
    );
  };

  const hasChanges = Object.keys(editForm).some((key) => editForm[key] !== guard[key]);

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <GuardHeader
        guard={guard}
        isEditing={isEditing}
        isSavingEdit={isSavingEdit}
        hasChanges={hasChanges}
        setIsEditing={setIsEditing}
        handleSaveEdit={handleSaveEdit}
        setIsUpdateLevelModalOpen={setIsUpdateLevelModalOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        setEditForm={setEditForm}
        getTabParam={getTabParam}
        getStatusBreadcrumb={getStatusBreadcrumb}
      />

      <GuardProfileSummary
        guard={guard}
        isEditing={isEditing}
        editForm={editForm}
        handleEditChange={handleEditChange}
        phoneCountries={phoneCountries}
        selectedPhoneCountry={selectedPhoneCountry}
        setSelectedPhoneCountry={setSelectedPhoneCountry}
        isPhoneDropdownOpen={isPhoneDropdownOpen}
        setIsPhoneDropdownOpen={setIsPhoneDropdownOpen}
        getLevelBadge={getLevelBadge}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GuardPersonalDetails
          guard={guard}
          isEditing={isEditing}
          editForm={editForm}
          handleEditChange={handleEditChange}
        />

        <GuardContactInfo guard={guard} />

        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <GuardAddress
            guard={guard}
            isEditing={isEditing}
            editForm={editForm}
            handleEditChange={handleEditChange}
            countries={countries}
            states={states}
            cities={cities}
          />

          <GuardPreferences
            guard={guard}
            isEditing={isEditing}
            editForm={editForm}
            handleEditChange={handleEditChange}
          />
        </div>

        <GuardDocuments
          guard={guard}
          isEditing={isEditing}
          editForm={editForm}
          handleEditChange={handleEditChange}
          localPreviews={localPreviews}
          localFileNames={localFileNames}
          deletingDocs={deletingDocs}
          handleDeleteDocument={handleDeleteDocument}
        />

        <GuardNotesAndBadge
          guard={guard}
          notes={notes}
          setNotes={setNotes}
          handleSaveNotes={handleSaveNotes}
          isSavingNotes={isSavingNotes}
          setIsCreateModalOpen={setIsCreateModalOpen}
          setIsViewModalOpen={setIsViewModalOpen}
          handleDeleteBadge={handleDeleteBadge}
        />
      </div>

      {(guard.action?.is_approved || guard.action?.is_disqualified) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 pb-2">
          {guard.action?.is_approved && (
            <Button onClick={() => setIsApproveModalOpen(true)} disabled={isUpdatingStatus !== null} className="w-full sm:w-[160px] h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] shadow-md shadow-green-100 border-none">
              {isUpdatingStatus === "approved" ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Approve
            </Button>
          )}
          {guard.action?.is_disqualified && (
            <Button onClick={() => setIsDeclineModalOpen(true)} disabled={isUpdatingStatus !== null} className="w-full sm:w-[160px] h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] shadow-md shadow-red-100 border-none">
              {isUpdatingStatus === "disqualified" ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              Decline
            </Button>
          )}
        </div>
      )}

      <div className="text-center text-[12px] text-slate-500 space-y-1 pt-6 border-t border-slate-100/50 mt-8">
        {guard.performed_by && (
          <p className="font-semibold">Record touch by : <span className="text-slate-700">{guard.performed_by}</span></p>
        )}
        {guard.created_at && (
          <p className="font-semibold">Form submit on : <span className="text-slate-700"><FormattedDate date={guard.created_at} includeTime={false} /></span></p>
        )}
      </div>

      <ApproveGuardDialog isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} onConfirm={async (level) => { const success = await handleUpdateStatus("approved", level); if (success) { setIsApproveModalOpen(false); } }} guard={guard} isLoading={isUpdatingStatus === "approved"} />
      <ApproveGuardDialog isOpen={isUpdateLevelModalOpen} onClose={() => setIsUpdateLevelModalOpen(false)} onConfirm={handleUpdateLevel} guard={guard} isLoading={isUpdatingLevel} isUpdateMode={true} />
      <DeclineGuardDialog isOpen={isDeclineModalOpen} onClose={() => setIsDeclineModalOpen(false)} onConfirm={async () => { const success = await handleUpdateStatus("disqualified"); if (success) { setIsDeclineModalOpen(false); } }} guard={guard} isLoading={isUpdatingStatus === "disqualified"} />
      <ConfirmationDialog isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} onConfirm={handleDeleteApplication} title="Delete Guard Application?" description="Are you sure you want to delete this guard application? This action cannot be undone." confirmText="Yes, delete it" isDanger={true} isLoading={isDeleting} />
      <BadgeCreateDialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} defaultName={`${guard.first_name || ""} ${guard.last_name || ""}`.trim()} defaultEmail={guard.email || ""} defaultHeadshotUrl={guard.headshot_image_url || ""} onSubmit={handleCreateBadgeSubmit} isSubmitting={isGeneratingBadge} />
      <BadgeViewDialog isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} badgeUrl={guard.guard_badge_url || ""} onDownload={handleDownloadBadge} onDelete={handleDeleteBadge} isDeleting={isDeletingBadge} />
    </div>
  );
}
