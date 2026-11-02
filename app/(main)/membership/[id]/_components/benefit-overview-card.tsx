"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Gift,
  Building,
  MapPin,
  Calendar,
  Loader2,
  Pencil,
  Save,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateMembershipAction,
  generateBenefitImageUploadUrlAction,
  MembershipBenefitItem,
} from "@/actions/membership.actions";

const CATEGORIES = [
  "Gym",
  "Restaurant",
  "Apparel",
  "Healthcare",
  "Education",
  "Entertainment",
  "Travel",
  "Other",
];

interface BenefitOverviewCardProps {
  benefit: MembershipBenefitItem;
  membershipId: string;
  onRefresh: () => Promise<void>;
}

export function BenefitOverviewCard({
  benefit,
  membershipId,
  onRefresh,
}: BenefitOverviewCardProps) {
  const [isEditingBenefit, setIsEditingBenefit] = useState(false);
  const [isSavingBenefit, setIsSavingBenefit] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [editBenefitForm, setEditBenefitForm] = useState({
    benefit_name: "",
    category: "Gym",
    business_partner_name: "",
    business_logo: "",
    description: "",
    location: "",
    start_date: "",
    expiry_date: "",
    status: "active",
  });

  useEffect(() => {
    if (benefit) {
      const logo = benefit.business_logo || benefit.image_url || "";
      if (!isEditingBenefit) {
        setLogoPreview(logo || null);
        setImageError(false);
      }
    }
  }, [benefit, isEditingBenefit]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const toInputDateValue = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch { }
    return dateStr;
  };

  const handleStartEditBenefit = () => {
    if (!benefit) return;
    const currentLogo = benefit.business_logo || benefit.image_url || "";
    setLogoPreview(currentLogo || null);
    setEditBenefitForm({
      benefit_name: benefit.benefit_name || "",
      category: benefit.category || "Gym",
      business_partner_name: benefit.business_partner_name || benefit.provider || "",
      business_logo: currentLogo,
      description: benefit.description || "",
      location: benefit.location || "",
      start_date: toInputDateValue(benefit.start_date || benefit.startDate),
      expiry_date: toInputDateValue(benefit.expiry_date || benefit.expiryDate),
      status: (benefit.status || "active").toLowerCase(),
    });
    setIsEditingBenefit(true);
  };

  const handleCancelEditBenefit = () => {
    setIsEditingBenefit(false);
    setLogoPreview(benefit?.business_logo || benefit?.image_url || null);
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    setImageError(false);
    setIsUploadingLogo(true);
    setUploadProgress(0);

    try {
      const folderName =
        editBenefitForm.benefit_name.trim() ||
        benefit?.benefit_name ||
        benefit?.business_partner_name ||
        "benefits";
      const res = await generateBenefitImageUploadUrlAction({
        file_name: file.name,
        type: "benefit",
        folder_name: folderName,
      });
      if (!res.success || !res.data?.signed_url) {
        throw new Error(res.error || "Failed to generate upload URL");
      }
      const signedUrl = res.data.signed_url;
      const finalUrl = signedUrl || res.data.public_url || res.data.file_path;

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          setEditBenefitForm((prev) => ({ ...prev, business_logo: finalUrl }));
          setIsUploadingLogo(false);
          toast.success("Logo uploaded successfully");
        } else {
          setIsUploadingLogo(false);
          toast.error("Failed to upload image to server");
        }
      };

      xhr.onerror = () => {
        setIsUploadingLogo(false);
        toast.error("Network error while uploading image");
      };

      xhr.send(file);
    } catch (err: unknown) {
      setIsUploadingLogo(false);
      const msg = err instanceof Error ? err.message : "Error uploading logo";
      toast.error(msg);
    }
  };

  const isBenefitDirty = useMemo(() => {
    if (!benefit) return false;
    const initialName = (benefit.benefit_name || "").trim();
    const initialCategory = benefit.category || "Gym";
    const initialProvider = (benefit.business_partner_name || benefit.provider || "").trim();
    const initialLogo = benefit.business_logo || benefit.image_url || "";
    const initialDescription = (benefit.description || "").trim();
    const initialLocation = (benefit.location || "").trim();
    const initialStartDate = toInputDateValue(benefit.start_date || benefit.startDate);
    const initialExpiryDate = toInputDateValue(benefit.expiry_date || benefit.expiryDate);
    const initialStatus = (benefit.status || "active").toLowerCase();

    return (
      editBenefitForm.benefit_name.trim() !== initialName ||
      editBenefitForm.category !== initialCategory ||
      editBenefitForm.business_partner_name.trim() !== initialProvider ||
      editBenefitForm.business_logo !== initialLogo ||
      editBenefitForm.description.trim() !== initialDescription ||
      editBenefitForm.location.trim() !== initialLocation ||
      editBenefitForm.start_date !== initialStartDate ||
      editBenefitForm.expiry_date !== initialExpiryDate ||
      editBenefitForm.status.toLowerCase() !== initialStatus
    );
  }, [benefit, editBenefitForm]);

  const handleSaveBenefit = async () => {
    if (!membershipId) return;
    if (!isBenefitDirty) return;
    if (!editBenefitForm.benefit_name.trim()) {
      toast.error("Benefit name is required");
      return;
    }
    if (!editBenefitForm.business_partner_name.trim()) {
      toast.error("Provider name is required");
      return;
    }
    if (!editBenefitForm.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!editBenefitForm.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!editBenefitForm.start_date) {
      toast.error("Start date is required");
      return;
    }
    if (!editBenefitForm.expiry_date) {
      toast.error("Expiry date is required");
      return;
    }

    setIsSavingBenefit(true);
    try {
      const logoToSave =
        editBenefitForm.business_logo ||
        benefit.business_logo ||
        benefit.image_url ||
        "";
      const payloadToUpdate = {
        benefit_name: editBenefitForm.benefit_name.trim(),
        category: editBenefitForm.category,
        business_partner_name: editBenefitForm.business_partner_name.trim(),
        business_logo: logoToSave,
        description: editBenefitForm.description.trim(),
        location: editBenefitForm.location.trim(),
        start_date: editBenefitForm.start_date,
        expiry_date: editBenefitForm.expiry_date,
        status: editBenefitForm.status.toLowerCase(),
      };

      console.log("===> [Edit Benefit Save Payload]:", {
        membership_id: membershipId,
        ...payloadToUpdate,
      });

      const res = await updateMembershipAction(membershipId, payloadToUpdate);

      if (res.success) {
        toast.success(res.message || "Benefit updated successfully");
        setIsEditingBenefit(false);
        await onRefresh();
      } else {
        toast.error(res.error || "Failed to update benefit");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving benefit";
      toast.error(msg);
    } finally {
      setIsSavingBenefit(false);
    }
  };

  const normalizedStatus = (benefit.status || "active").toLowerCase();
  const isStatusActive = normalizedStatus === "active";
  const isStatusExpired = normalizedStatus === "expired";
  const statusLabel = isStatusActive ? "Active" : isStatusExpired ? "Expired" : "Inactive";

  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white !gap-0 !py-0">
      <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
            <Gift className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-bold text-slate-900">
            Benefit Overview
          </CardTitle>
        </div>

        {!isEditingBenefit ? (
          <Button
            onClick={handleStartEditBenefit}
            variant="outline"
            className="h-9 px-4 text-xs sm:text-[13px] font-semibold text-[#0064cb] border-[#0064cb]/30 hover:bg-blue-50 cursor-pointer rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Pencil className="w-4 h-4" /> Edit Benefit
          </Button>
        ) : (
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleCancelEditBenefit}
              disabled={isSavingBenefit}
              variant="outline"
              className="h-9 px-4 sm:px-5 text-xs sm:text-[13px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBenefit}
              disabled={isSavingBenefit || !isBenefitDirty || isUploadingLogo}
              className="h-9 px-5 sm:px-6 bg-[#0064cb] hover:bg-[#0052ae] text-white text-xs sm:text-[13px] font-bold rounded-lg shadow-sm shadow-blue-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              {isSavingBenefit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save
                </>
              )}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-4 border-b border-slate-100">
          {(() => {
            const activeLogo =
              logoPreview ||
              benefit?.business_logo ||
              benefit?.image_url ||
              editBenefitForm.business_logo ||
              null;

            return isEditingBenefit ? (
              <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                  className="hidden"
                />
                {activeLogo && !imageError ? (
                  <img
                    src={activeLogo}
                    alt="Benefit logo"
                    onError={() => setImageError(true)}
                    className={cn(
                      "w-full h-full object-contain p-1 transition-opacity",
                      isUploadingLogo && "opacity-30"
                    )}
                  />
                ) : (
                  <Gift className="w-12 h-12 text-[#0064cb]" />
                )}

                {isUploadingLogo ? (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-2 text-center pointer-events-none z-10">
                    <Loader2 className="w-5 h-5 animate-spin mb-1 text-white" />
                    <span className="text-[10px] font-bold text-white tracking-wide">
                      {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : "Uploading..."}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-semibold p-1 text-center"
                    title="Click to change logo"
                  >
                    <Camera className="w-4 h-4 mb-1" />
                    <span>Change Logo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {activeLogo && !imageError ? (
                  <img
                    src={activeLogo}
                    alt={benefit?.business_partner_name || benefit?.benefit_name || "Benefit Logo"}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Gift className="w-12 h-12 text-[#0064cb]" />
                )}
              </div>
            );
          })()}

          <div className="space-y-3 min-w-0 flex-1 w-full">
            {isEditingBenefit ? (
              <div>
                <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Benefit Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={editBenefitForm.benefit_name}
                  onChange={(e) =>
                    setEditBenefitForm((prev) => ({ ...prev, benefit_name: e.target.value }))
                  }
                  placeholder="e.g. Gym Membership Discount"
                  className="h-9 text-base font-bold text-slate-900 border-slate-200 bg-white"
                />
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Benefit Name
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate mt-0.5">
                  {benefit.benefit_name}
                </h3>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2.5 border-t border-slate-100">
              {isEditingBenefit ? (
                <div className="space-y-1 min-w-0">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Provider Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editBenefitForm.business_partner_name}
                    onChange={(e) =>
                      setEditBenefitForm((prev) => ({
                        ...prev,
                        business_partner_name: e.target.value,
                      }))
                    }
                    placeholder="e.g. ABC Gym"
                    className="h-8 text-xs border-slate-200 bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Provider Name
                  </span>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{benefit.business_partner_name || "—"}</span>
                  </p>
                </div>
              )}

              {isEditingBenefit ? (
                <div className="space-y-1 min-w-0">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editBenefitForm.category}
                    onValueChange={(val) =>
                      setEditBenefitForm((prev) => ({ ...prev, category: val }))
                    }
                  >
                    <SelectTrigger className="w-full !h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-lg z-[100]">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Category
                  </span>
                  <div className="mt-0.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0064cb] border border-blue-100 text-[11px] font-bold">
                      {benefit.category || "—"}
                    </span>
                  </div>
                </div>
              )}

              {isEditingBenefit ? (
                <div className="space-y-1 min-w-0">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editBenefitForm.status}
                    onValueChange={(val) =>
                      setEditBenefitForm((prev) => ({ ...prev, status: val }))
                    }
                  >
                    <SelectTrigger className="w-full !h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-lg z-[100]">
                      <SelectItem value="active" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                          <span>Active</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          <span>Inactive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expired" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span>Expired</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isStatusActive
                          ? "bg-green-500"
                          : isStatusExpired
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold whitespace-nowrap",
                        isStatusActive
                          ? "text-green-700"
                          : isStatusExpired
                            ? "text-amber-700"
                            : "text-red-700"
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )}

              {isEditingBenefit ? (
                <div className="space-y-1 min-w-0">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={editBenefitForm.start_date}
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(e) =>
                      setEditBenefitForm((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                    className="h-8 text-xs border-slate-200 bg-white cursor-pointer px-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Start Date
                  </span>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(benefit.start_date || benefit.startDate)}</span>
                  </p>
                </div>
              )}

              {isEditingBenefit ? (
                <div className="space-y-1 min-w-0">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    min={editBenefitForm.start_date || undefined}
                    value={editBenefitForm.expiry_date}
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(e) =>
                      setEditBenefitForm((prev) => ({ ...prev, expiry_date: e.target.value }))
                    }
                    className="h-8 text-xs border-slate-200 bg-white cursor-pointer px-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Expiry Date
                  </span>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(benefit.expiry_date || benefit.expiryDate)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
          {isEditingBenefit ? (
            <div className="md:col-span-4 p-3.5 bg-slate-50/80 border border-slate-100 rounded-lg space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Location <span className="text-red-500">*</span>
              </Label>
              <div className="relative w-full">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={editBenefitForm.location}
                  onChange={(e) =>
                    setEditBenefitForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. Nationwide or Miami, FL"
                  className="h-8 pl-8 text-xs border-slate-200 bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="md:col-span-4 p-3.5 bg-slate-50/80 border border-slate-100 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Location
              </span>
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{benefit.location || "Nationwide"}</span>
              </p>
            </div>
          )}

          {isEditingBenefit ? (
            <div className="md:col-span-8 p-3.5 bg-slate-50/80 border border-slate-100 rounded-lg space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Description & Details <span className="text-red-500">*</span>
                </Label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {editBenefitForm.description.length}/250
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={250}
                value={editBenefitForm.description}
                onChange={(e) =>
                  setEditBenefitForm((prev) => ({
                    ...prev,
                    description: e.target.value.slice(0, 250),
                  }))
                }
                placeholder="Enter benefit description, terms, etc."
                className="w-full rounded-md border border-slate-200 p-2 text-xs text-slate-800 bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0064cb] resize-none"
              />
            </div>
          ) : (
            <div className="md:col-span-8 p-3.5 bg-slate-50/80 border border-slate-100 rounded-lg space-y-1 min-w-0 overflow-hidden">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Description & Details
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] break-all">
                {benefit.description || "No description provided."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
