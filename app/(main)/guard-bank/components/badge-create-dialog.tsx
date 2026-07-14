"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Check, Crop, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageCropDialog } from "./image-crop-dialog";

interface BadgeCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  defaultEmail: string;
  defaultHeadshotUrl: string;
  onSubmit: (formData: FormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export function BadgeCreateDialog({
  isOpen,
  onClose,
  defaultName,
  defaultEmail,
  defaultHeadshotUrl,
  onSubmit,
  isSubmitting
}: BadgeCreateDialogProps) {
  const [badgeName, setBadgeName] = useState("");
  const [badgeType, setBadgeType] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [hasHeadshot, setHasHeadshot] = useState(true);
  const [selectedHeadshotFile, setSelectedHeadshotFile] = useState<File | null>(null);

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    badgeType?: string;
    issueDate?: string;
    expiryDate?: string;
    headshot?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setBadgeName(defaultName);
      setBadgeType("");
      const today = new Date().toISOString().split("T")[0];
      setIssueDate(today);
      setExpiryDate("");
      setHasHeadshot(!!defaultHeadshotUrl);
      setSelectedHeadshotFile(null);
      setFormErrors({});
    }
  }, [isOpen, defaultName, defaultHeadshotUrl]);

  const handleNameChange = (val: string) => {
    setBadgeName(val);
    if (formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleBadgeTypeChange = (val: string) => {
    setBadgeType(val);
    if (formErrors.badgeType) {
      setFormErrors(prev => ({ ...prev, badgeType: undefined }));
    }
  };

  const handleIssueDateChange = (val: string) => {
    setIssueDate(val);
    if (formErrors.issueDate) {
      setFormErrors(prev => ({ ...prev, issueDate: undefined }));
    }
  };

  const handleExpiryDateChange = (val: string) => {
    setExpiryDate(val);
    if (formErrors.expiryDate) {
      setFormErrors(prev => ({ ...prev, expiryDate: undefined }));
    }
  };

  const handleOpenCrop = () => {
    let src = "";
    if (selectedHeadshotFile) {
      src = URL.createObjectURL(selectedHeadshotFile);
    } else if (defaultHeadshotUrl) {
      src = defaultHeadshotUrl;
    }
    if (src) {
      setCropImageSrc(src);
      setIsCropModalOpen(true);
    } else {
      toast.error("No image available to crop");
    }
  };

  const handleCropApplied = (file: File) => {
    setSelectedHeadshotFile(file);
    setHasHeadshot(true);
    setIsCropModalOpen(false);
    if (formErrors.headshot) {
      setFormErrors(prev => ({ ...prev, headshot: undefined }));
    }
    toast.success("Image cropped successfully!");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof formErrors = {};
    if (!badgeName.trim()) {
      errors.name = "Name is required";
    }
    if (!badgeType.trim()) {
      errors.badgeType = "Badge type is required";
    }
    if (!issueDate) {
      errors.issueDate = "Issue date is required";
    }
    if (!expiryDate) {
      errors.expiryDate = "Expiry date is required";
    }
    if (!hasHeadshot || (!selectedHeadshotFile && !defaultHeadshotUrl)) {
      errors.headshot = "A passport headshot is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    setFormErrors({});

    const formData = new FormData();
    formData.append("name", badgeName);
    formData.append("badge", badgeType);
    formData.append("date_new", issueDate);
    formData.append("expiry_new", expiryDate);
    formData.append("email", defaultEmail);

    if (selectedHeadshotFile) {
      formData.append("passport_image", selectedHeadshotFile, selectedHeadshotFile.name);
    } else if (defaultHeadshotUrl) {
      try {
        const response = await fetch(defaultHeadshotUrl);
        const blob = await response.blob();
        formData.append("passport_image", blob, "headshot.png");
      } catch (error) {
        toast.error("Failed to load original passport image. Please upload a new image.");
        return;
      }
    } else {
      toast.error("A passport headshot is required");
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl bg-white p-6 rounded-lg shadow-xl font-sans overflow-y-auto max-h-[90vh] border border-slate-100">
          <DialogHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-800">Upload FAST GUARD BADGE ID</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-5 pt-3">
            <div className="space-y-2">
              <label className={cn("text-xs font-bold block", formErrors.headshot ? "text-red-500" : "text-slate-700")}>Passport Image:</label>
              {hasHeadshot && (selectedHeadshotFile || defaultHeadshotUrl) ? (
                <div className={cn("bg-slate-50 border rounded-lg p-4 flex items-start gap-4 transition-colors", formErrors.headshot ? "border-red-500" : "border-slate-200")}>
                  <img
                    src={selectedHeadshotFile ? URL.createObjectURL(selectedHeadshotFile) : defaultHeadshotUrl}
                    alt="Passport Headshot"
                    className="w-20 h-24 rounded border border-slate-200 object-cover"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-2 py-1 rounded w-fit">
                      <Check className="w-4 h-4 text-green-600" />
                      {selectedHeadshotFile ? "Headshot Selected" : "Headshot Auto-loaded"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCrop}
                        className="h-8 text-xs font-semibold flex items-center gap-1 px-3 border-blue-200 text-[#0064cb] hover:bg-blue-50 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        Crop
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHasHeadshot(false);
                          setSelectedHeadshotFile(null);
                        }}
                        className="h-8 text-xs font-semibold flex items-center gap-1 px-3 border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn("border border-dashed rounded-lg p-6 bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors", formErrors.headshot ? "border-red-500" : "border-slate-300")}>
                  <span className="text-xs text-slate-500 font-medium">Headshot image not loaded</span>
                  <label className="h-8 text-xs font-semibold px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 bg-white shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95">
                    Upload Headshot Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedHeadshotFile(file);
                          setHasHeadshot(true);
                          if (formErrors.headshot) {
                            setFormErrors(prev => ({ ...prev, headshot: undefined }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}
              {formErrors.headshot && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.headshot}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.name ? "text-red-500" : "text-slate-700")}>Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={badgeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.name ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.name && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.badgeType ? "text-red-500" : "text-slate-700")}>Badge Type:</label>
                <input
                  type="text"
                  placeholder="Enter badge type"
                  value={badgeType}
                  onChange={(e) => handleBadgeTypeChange(e.target.value)}
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.badgeType ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.badgeType && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.badgeType}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.issueDate ? "text-red-500" : "text-slate-700")}>Issue Date:</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.issueDate ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.issueDate && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.issueDate}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={cn("text-xs font-bold block", formErrors.expiryDate ? "text-red-500" : "text-slate-700")}>Expiry Date:</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => handleExpiryDateChange(e.target.value)}
                  className={cn(
                    "w-full text-sm font-semibold p-2 border rounded focus:outline-none focus:ring-2 transition-all",
                    formErrors.expiryDate ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-[#0064cb]/20"
                  )}
                />
                {formErrors.expiryDate && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{formErrors.expiryDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Email:</label>
              <input
                type="email"
                placeholder="Enter email"
                value={defaultEmail}
                disabled
                className="w-full text-sm font-semibold p-2 border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow cursor-pointer transition-all active:scale-[0.99] border-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Badge...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 rotate-180" />
                  Submit
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={cropImageSrc}
        onCropApplied={handleCropApplied}
      />
    </>
  );
}
