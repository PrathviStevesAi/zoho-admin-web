import { Mail, Phone, ChevronDown, CheckCircle2, XCircle, Calendar, Plus, Loader2 } from "lucide-react";
import { FormattedDate } from "@/components/ui/formatted-date";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { getSession } from "next-auth/react";
import { toast } from "sonner";

interface GuardProfileSummaryProps {
  guard: any;
  isEditing: boolean;
  editForm: any;
  handleEditChange: (field: string, value: any) => void;
  phoneCountries: any[];
  selectedPhoneCountry: any;
  setSelectedPhoneCountry: (country: any) => void;
  isPhoneDropdownOpen: boolean;
  setIsPhoneDropdownOpen: (isOpen: boolean) => void;
  getLevelBadge: (level: number) => React.ReactNode;
  formErrors?: Record<string, string>;
  refreshGuardDetails?: () => void;
}

export function GuardProfileSummary({
  guard,
  isEditing,
  editForm,
  handleEditChange,
  phoneCountries,
  selectedPhoneCountry,
  setSelectedPhoneCountry,
  isPhoneDropdownOpen,
  setIsPhoneDropdownOpen,
  getLevelBadge,
  formErrors,
  refreshGuardDetails
}: GuardProfileSummaryProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    setIsUploadingImage(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const generateRes = await fetch(`${baseUrl}/api/v1/shift/media/generate-upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: "profile_img",
          guard_id: guard.id,
          file_name: file.name
        })
      });

      if (!generateRes.ok) {
        throw new Error("Failed to generate upload URL");
      }

      const generateData = await generateRes.json();
      const signedUrl = generateData.data?.signed_url;
      const filePath = generateData.data?.file_path;

      if (!signedUrl || !filePath) {
        throw new Error("Invalid response from server");
      }

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image");
      }

      const patchRes = await fetch(`${baseUrl}/api/v1/guard/bank/application/${guard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ profile_img_url: filePath })
      });

      if (!patchRes.ok) {
        throw new Error("Failed to update profile image in database");
      }

      toast.success("Profile image updated successfully");

      if (refreshGuardDetails) {
        refreshGuardDetails();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while uploading the image");
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const currentImage = previewImage || guard.profile_img_url;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5 sm:gap-6 justify-between">
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden">
            {currentImage ? (
              <img src={currentImage} alt="Guard Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src="/guard-placeholder.png" alt="Guard Avatar" className="w-full h-full object-contain opacity-80 p-2.5 sm:p-3" />
            )}
          </div>

          {guard?.action?.is_profile_img_edit && (
            <button
              onClick={() => !isUploadingImage && fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-colors cursor-pointer z-10"
              title="Upload Profile Image"
            >
              {isUploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-3 sm:space-y-4 flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left w-full">
          <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 truncate w-full">
            {`${guard.first_name || ""} ${guard.last_name || ""}`.trim() || "Guard Name"}
          </h2>

          <div>
            {guard.guard_level && getLevelBadge(guard.guard_level)}
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-[13px] font-medium text-slate-600 w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 min-w-0 w-full sm:w-auto">
              <Mail className="w-4 h-4 text-[#0064cb] shrink-0" />
              <a href={`mailto:${guard.email}`} className="hover:text-[#0064cb] transition-colors truncate block max-w-full sm:max-w-none">{guard.email || "N/A"}</a>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 min-w-0 w-full sm:w-auto">
              <Phone className="w-4 h-4 text-[#0064cb] shrink-0" />
              {isEditing && <span className="text-red-500 font-bold -ml-0.5">*</span>}
              {isEditing ? (
                <div className="flex flex-col w-full max-w-[300px]">
                  <div className={cn("relative flex items-center h-10 bg-white border rounded-md focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-2 transition-all w-full", formErrors?.phone_number ? "border-red-500 ring-1 ring-red-500" : "border-slate-200")}>
                    <button
                      type="button"
                      onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 h-full rounded-l-md hover:bg-slate-50 border-r border-slate-200 transition-colors focus:outline-none cursor-pointer"
                    >
                      <img
                        src={`https://flagcdn.com/w20/${selectedPhoneCountry.code}.png`}
                        alt={selectedPhoneCountry.name}
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                      />
                      <span className="text-sm font-semibold text-slate-700">{selectedPhoneCountry.dialCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <div className="relative flex-1 h-full flex items-center">
                      <input
                        type="text"
                        placeholder="Phone number"
                        value={(() => {
                          const val = editForm.phone_number || "";
                          if (val.startsWith(selectedPhoneCountry.dialCode)) {
                            return val.substring(selectedPhoneCountry.dialCode.length).trim();
                          }
                          return val;
                        })()}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                          handleEditChange("phone_number", selectedPhoneCountry.dialCode + " " + digits);
                        }}
                        className="w-full h-full bg-transparent outline-none border-none px-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal text-sm"
                      />
                    </div>

                    {isPhoneDropdownOpen && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsPhoneDropdownOpen(false)}
                      />
                    )}

                    {isPhoneDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg z-50">
                        {phoneCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedPhoneCountry(country);
                              const currentVal = editForm.phone_number || "";
                              const valWithoutCode = currentVal.startsWith(selectedPhoneCountry.dialCode)
                                ? currentVal.substring(selectedPhoneCountry.dialCode.length).trim()
                                : currentVal;
                              handleEditChange("phone_number", country.dialCode + " " + valWithoutCode);
                              setIsPhoneDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer ${selectedPhoneCountry.code === country.code ? "bg-slate-50 font-semibold" : "text-slate-700"}`}
                          >
                            <img
                              src={`https://flagcdn.com/w20/${country.code}.png`}
                              alt={country.name}
                              className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                            />
                            <span className="flex-1">{country.name}</span>
                            <span className="text-slate-500 font-medium">{country.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formErrors?.phone_number && <p className="text-xs text-red-500 font-medium mt-1">{formErrors.phone_number}</p>}
                </div>
              ) : (
                <a href={`tel:${guard.phone_number?.replace(/\s/g, '')}`} className="hover:text-[#0064cb] transition-colors">{guard.phone_number || "N/A"}</a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between lg:justify-start gap-4 sm:gap-12 lg:pl-10 lg:border-l lg:border-slate-100 pt-4 sm:pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto mt-2 lg:mt-0">
        <div className="space-y-1 sm:space-y-2">
          <span className="text-[11px] sm:text-[12px] text-slate-500 font-medium">Status</span>
          <div className="flex items-center gap-1.5">
            {guard.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : guard.status === 'disqualified' ? <XCircle className="w-4 h-4 text-red-600" /> : <div className="w-4 h-4 rounded-full border-2 border-amber-500" />}
            <span className={`text-[13px] font-bold capitalize ${guard.status === 'approved' ? 'text-green-600' : guard.status === 'disqualified' ? 'text-red-600' : 'text-amber-600'}`}>
              {guard.status}
            </span>
          </div>
        </div>
        <div className="space-y-1 sm:space-y-2 text-right lg:text-left">
          <span className="text-[11px] sm:text-[12px] text-slate-500 font-medium">Form Submit - Date</span>
          <div className="flex items-center justify-end lg:justify-start gap-1.5 text-slate-700">
            <Calendar className="w-4 h-4" />
            <span className="text-[13px] font-bold">
              {guard.created_at ? <FormattedDate date={guard.created_at} includeTime={false} /> : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
