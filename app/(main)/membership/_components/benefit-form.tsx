"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  Gift,
  UploadCloud,
  ImageIcon,
  X,
  Calendar,
  MapPin,
  Loader2,
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
import type { Benefit } from "../page";
import { generateBenefitImageUploadUrlAction } from "@/actions/membership.actions";

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

interface BenefitFormProps {
  initialData?: Benefit | null;
  onBack: () => void;
  onSave: (data: {
    name: string;
    category: string;
    provider: string;
    status: "Active" | "Inactive";
    description: string;
    discountValue: string;
    assignedGuardsCount: number;
    assignedGuardNames: string[];
    imageUrl?: string;
    location?: string;
    startDate?: string;
    expiryDate?: string;
  }) => Promise<void> | void;
}

export function BenefitForm({
  initialData,
  onBack,
  onSave,
}: BenefitFormProps) {
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "Gym",
    provider: initialData?.provider || "",
    status: (initialData?.status || "Active") as "Active" | "Inactive",
    description: initialData?.description || "",
    discountValue: initialData?.discountValue || "",
    imageUrl: initialData?.imageUrl || "",
    location: initialData?.location || "",
    startDate: initialData?.startDate || "",
    expiryDate: initialData?.expiryDate || "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isFormValid = Boolean(
    !isUploadingImage &&
    formData.name.trim() &&
    formData.category &&
    formData.provider.trim() &&
    formData.location.trim() &&
    formData.description.trim() &&
    formData.startDate &&
    formData.expiryDate
  );

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      const res = await generateBenefitImageUploadUrlAction({
        file_name: file.name,
        type: "common",
        folder_name: "benefits",
      });

      if (!res.success || !res.data?.signed_url) {
        throw new Error(res.error || "Failed to generate upload URL");
      }

      const signedUrl = res.data.signed_url;
      const finalUrl =
        res.data.public_url ||
        res.data.file_path ||
        signedUrl.split("?")[0];

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
          setFormData((prev) => ({ ...prev, imageUrl: finalUrl }));
          setIsUploadingImage(false);
          toast.success("Image uploaded successfully");
        } else {
          setIsUploadingImage(false);
          toast.error("Failed to upload image file");
        }
      };

      xhr.onerror = () => {
        setIsUploadingImage(false);
        toast.error("Network error while uploading image");
      };

      xhr.send(file);
    } catch (err: unknown) {
      setIsUploadingImage(false);
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Benefit name is required";
    if (!formData.provider.trim()) newErrors.provider = "Provider name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        name: formData.name.trim(),
        category: formData.category,
        provider: formData.provider.trim(),
        status: formData.status,
        description: formData.description.trim(),
        discountValue: formData.discountValue.trim(),
        assignedGuardsCount: initialData?.assignedGuardsCount || 0,
        assignedGuardNames: initialData?.assignedGuardNames || [],
        imageUrl: formData.imageUrl,
        location: formData.location.trim(),
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-in fade-in duration-300 font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            type="button"
            onClick={onBack}
            className="text-slate-700 hover:text-[#0064cb] transition-colors cursor-pointer"
          >
            Membership
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">
            {isEditing ? "Edit Benefit" : "Create Benefit"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] hover:bg-slate-50 transition-all cursor-pointer"
            title="Back to benefits list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing ? "Edit Benefit" : "Add New Benefit"}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white border-slate-200/80 shadow-xs rounded-xl overflow-hidden !py-0 !gap-0">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gift className="size-4 text-[#0064cb]" />
              Benefit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <Label htmlFor="benefitName" className="text-xs font-semibold text-slate-700">
                    Benefit Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="benefitName"
                    placeholder="Enter Benefit Name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      clearError("name");
                    }}
                    className={cn(
                      "h-10 text-sm bg-white border-slate-200 focus-visible:ring-[#0064cb]",
                      errors.name && "border-red-500"
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 font-medium">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger id="category" className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-[#0064cb]" />
                  <span>Benefit Image</span>
                </Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="benefit-image-upload"
                />

                {imagePreview ? (
                  <div className="flex-1 min-h-[110px] rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 sm:p-3 flex items-center gap-4">
                    <div className="relative w-56 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white shadow-xs">
                      <Image
                        src={imagePreview}
                        alt="Benefit preview"
                        fill
                        className={cn(
                          "object-cover transition-opacity duration-200",
                          isUploadingImage && "opacity-60"
                        )}
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center">
                          <Loader2 className="size-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {isUploadingImage ? (
                        <div className="space-y-1.5 pr-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5 text-[#0064cb]">
                              <UploadCloud className="size-3.5 animate-pulse" />
                              Uploading image...
                            </span>
                            <span className="tabular-nums font-bold text-slate-900">
                              {uploadProgress}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200/90 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-[#0064cb] rounded-full transition-all duration-200 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Please wait while we upload your image...
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-bold text-slate-800 truncate">
                              Image uploaded
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Displayed in guard app
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 px-3 text-xs font-medium cursor-pointer border-slate-200 hover:bg-slate-100"
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveImage}
                              className="h-7 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <X className="size-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex-1 min-h-[130px] border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                      isDragging
                        ? "border-[#0064cb] bg-blue-50/50"
                        : "border-slate-200 hover:border-[#0064cb]/60 hover:bg-slate-50/60"
                    )}
                  >
                    <div className="size-9 rounded-full bg-blue-50 flex items-center justify-center text-[#0064cb] mb-1.5">
                      <UploadCloud className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Click or drag image
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="provider" className="text-xs font-semibold text-slate-700">
                  Provider Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="provider"
                  placeholder="Enter Provider Name"
                  value={formData.provider}
                  onChange={(e) => {
                    setFormData({ ...formData, provider: e.target.value });
                    clearError("provider");
                  }}
                  className={cn(
                    "h-10 text-sm bg-white border-slate-200 focus-visible:ring-[#0064cb]",
                    errors.provider && "border-red-500"
                  )}
                />
                {errors.provider && (
                  <p className="text-xs text-red-500 font-medium">{errors.provider}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-[#0064cb]" />
                  <span>Location</span> <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Enter Location (e.g., Miami, FL or Nationwide)"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    clearError("location");
                  }}
                  className={cn(
                    "h-10 text-sm bg-white border-slate-200 focus-visible:ring-[#0064cb]",
                    errors.location && "border-red-500"
                  )}
                />
                {errors.location && (
                  <p className="text-xs text-red-500 font-medium">{errors.location}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                Description / Details <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Provide detailed description of the perk, coverage terms, discount details, and guard eligibility..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  clearError("description");
                }}
                className={cn(
                  "w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0064cb] placeholder:text-slate-400",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500 font-medium">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-700">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "Active" | "Inactive") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger id="status" className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Inactive">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500 inline-block" />
                        <span>Inactive</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#0064cb]" />
                  <span>Start Date</span> <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value });
                    clearError("startDate");
                  }}
                  className={cn(
                    "h-10 text-sm bg-white border-slate-200 focus-visible:ring-[#0064cb] cursor-pointer text-slate-700 w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-0.5",
                    errors.startDate && "border-red-500"
                  )}
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500 font-medium">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiryDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#0064cb]" />
                  <span>Expiry Date</span> <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  min={formData.startDate || undefined}
                  value={formData.expiryDate}
                  onChange={(e) => {
                    setFormData({ ...formData, expiryDate: e.target.value });
                    clearError("expiryDate");
                  }}
                  className={cn(
                    "h-10 text-sm bg-white border-slate-200 focus-visible:ring-[#0064cb] cursor-pointer text-slate-700 w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-0.5",
                    errors.expiryDate && "border-red-500"
                  )}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-red-500 font-medium">{errors.expiryDate}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 mt-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="cursor-pointer h-11 px-8 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-all text-sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="cursor-pointer h-11 px-10 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg font-bold shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>{isEditing ? "Saving Changes..." : "Creating Benefit..."}</span>
              </div>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Benefit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


