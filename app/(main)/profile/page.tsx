"use client";

import { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Camera,
  Edit3,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchProfileAction, updateProfileAction, generateUploadUrlAction } from "@/actions/profile.actions";
import { UserProfile } from "@/types/profile.types";

const countries = [
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

const findCountryFromPhone = (phone: string) => {
  if (!phone || !phone.startsWith("+")) return null;
  const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sortedCountries) {
    if (phone.startsWith(country.dialCode)) {
      return country;
    }
  }
  return null;
};

const getCountryAndPhone = (phoneVal: string) => {
  const countryMatch = findCountryFromPhone(phoneVal);
  if (countryMatch) {
    return {
      country: countryMatch,
      phone: phoneVal.slice(countryMatch.dialCode.length)
    };
  }
  return {
    country: countries[11], // default to US
    phone: phoneVal
  };
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCountry, setSelectedCountry] = useState(countries[11]); // Default to US
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    old_password: "",
    new_password: "",
    profile_img_url: ""
  });

  const currentFullPhone = editFormData.phone_number 
    ? `${selectedCountry.dialCode}${editFormData.phone_number}` 
    : "";

  const isFormChanged = user ? (
    editFormData.first_name !== user.first_name ||
    editFormData.last_name !== user.last_name ||
    currentFullPhone !== (user.phone_number || "") ||
    editFormData.old_password !== "" ||
    editFormData.new_password !== ""
  ) : false;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchProfileAction();
      console.log("fetchProfileAction Response:", res);
      if (res.success && res.data) {
        setUser(res.data);
        const parsed = getCountryAndPhone(res.data.phone_number || "");
        setSelectedCountry(parsed.country);
        setEditFormData({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          phone_number: parsed.phone,
          old_password: "",
          new_password: "",
          profile_img_url: res.data.profile_img_url || ""
        });
      } else {
        const defaultUser = {
          first_name: "not found",
          last_name: "not found",
          email: "not found",
          phone_number: "0000000000",
          role: "not found",
          profile_img_url: "",
        } as any;
        setUser(defaultUser);
        const parsed = getCountryAndPhone(defaultUser.phone_number);
        setSelectedCountry(parsed.country);
        setEditFormData({
          first_name: defaultUser.first_name || "",
          last_name: defaultUser.last_name || "",
          phone_number: parsed.phone,
          old_password: "",
          new_password: "",
          profile_img_url: defaultUser.profile_img_url || ""
        });
        toast.error(res?.error || "Failed to load profile, showing guest view");
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      const defaultUser = {
        first_name: "not found",
        last_name: "not found",
        email: "not found",
        phone_number: "0000000000",
        role: "not found",
        profile_img_url: "",
      } as any;
      setUser(defaultUser);
      const parsed = getCountryAndPhone(defaultUser.phone_number);
      setSelectedCountry(parsed.country);
      setEditFormData({
        first_name: defaultUser.first_name || "",
        last_name: defaultUser.last_name || "",
        phone_number: parsed.phone,
        old_password: "",
        new_password: "",
        profile_img_url: defaultUser.profile_img_url || ""
      });
      toast.error(err?.message || "Failed to load profile, showing guest view");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const payload: any = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        phone_number: currentFullPhone,
      };

      if (editFormData.profile_img_url && !editFormData.profile_img_url.startsWith('http')) {
        payload.profile_img_url = editFormData.profile_img_url;
      }

      if (editFormData.old_password && editFormData.new_password) {
        payload.old_password = editFormData.old_password;
        payload.new_password = editFormData.new_password;
      }

      console.log("updateProfileAction Payload:", payload);
      const res = await updateProfileAction(payload);
      console.log("updateProfileAction Response:", res);

      if (res.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        const refreshed = await fetchProfileAction();
        if (refreshed.success && refreshed.data) {
          const profileData = refreshed.data;
          setUser(profileData);
          const parsed = getCountryAndPhone(profileData.phone_number || "");
          setSelectedCountry(parsed.country);
          setEditFormData(prev => ({
            ...prev,
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            phone_number: parsed.phone,
            profile_img_url: profileData.profile_img_url || ""
          }));
          window.dispatchEvent(new CustomEvent("profile-updated"));
        }
      } else {
        toast.error(res?.error || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdating(true);

      // Convert HEIC/HEIF to JPEG before upload (browsers can't handle HEIC natively)
      let uploadFile: File = file;
      const isHeic = file.type === "image/heic" || file.type === "image/heif"
        || file.name.toLowerCase().endsWith(".heic")
        || file.name.toLowerCase().endsWith(".heif");

      if (isHeic) {
        toast.info("Converting HEIC image, please wait...");
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
        const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
        const jpegName = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
        uploadFile = new File([convertedBlob], jpegName, { type: "image/jpeg" });
      }

      // Generate unique file name
      const fileExt = uploadFile.name.split('.').pop();
      const fileNameWithoutExt = uploadFile.name.replace(/\.[^/.]+$/, "");
      const uniqueId = Math.floor(1000 + Math.random() * 9000);
      const uniqueFileName = `${fileNameWithoutExt}_${uniqueId}.${fileExt}`;

      console.log("generateUploadUrlAction Payload:", { file_name: uniqueFileName, type: "profile" });
      const res = await generateUploadUrlAction(uniqueFileName, "profile");
      console.log("generateUploadUrlAction Response:", res);

      if (!res.success || !res.data) throw new Error(res.error || "Failed to generate upload URL");

      const { signed_url, file_path } = res.data;
      console.log("Uploading file to:", signed_url);
      const uploadRes = await fetch(signed_url, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": uploadFile.type }
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");

      const updatePayload = {
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        profile_img_url: file_path
      };
      console.log("updateProfileAction (Avatar) Payload:", updatePayload);
      const updateRes = await updateProfileAction(updatePayload);
      console.log("updateProfileAction (Avatar) Response:", updateRes);

      if (updateRes.success) {
        toast.success("Profile image updated");
        // Update local edit form state with the new path
        setEditFormData(prev => ({ ...prev, profile_img_url: file_path }));

        const refreshed = await fetchProfileAction();
        if (refreshed.success && refreshed.data) {
          setUser(refreshed.data);
          window.dispatchEvent(new CustomEvent("profile-updated"));
        }
      } else {
        throw new Error(updateRes.error || "Failed to save profile image");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile image");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const currentUser = user || {
    first_name: "not found",
    last_name: "not found",
    email: "not found",
    phone_number: "0000000000",
    role: "not found",
    profile_img_url: ""
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-center gap-6 px-2">
        <div className="relative group">
          <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-white shadow-lg rounded-2xl bg-slate-50 overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
            <AvatarImage src={currentUser.profile_img_url || undefined} className="object-cover" />
            <AvatarFallback className="text-3xl font-bold bg-slate-100 text-[#0064cb]">
              {(currentUser.first_name?.[0] || "?").toUpperCase()}
              {(currentUser.last_name?.[0] || "").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*,.heic,.heif"
          />
          <Button
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdating}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-lg border-2 border-white transition-all active:scale-90 cursor-pointer"
          >
            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </Button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-black tracking-tight">
              {currentUser.first_name} {currentUser.last_name}
            </h1>
            <Badge className="w-fit mx-auto md:mx-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-2 py-0.5 font-bold rounded text-[10px] flex gap-1 items-center uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              {(currentUser.role || 'user').toUpperCase()}
            </Badge>
          </div>
          <p className="text-slate-700 font-medium text-sm flex items-center justify-center md:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {currentUser.email}
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="px-5 h-9 rounded-lg font-bold border-slate-200 text-xs text-slate-800 hover:bg-slate-50 transition-all cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} disabled={isUpdating || !isFormChanged} className="bg-[#0064cb] hover:bg-[#0052ae] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 h-9 rounded-lg font-bold text-xs shadow-md shadow-blue-100 transition-all active:scale-95 flex gap-2 cursor-pointer">
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-6 h-10 rounded-xl font-bold text-sm shadow-md shadow-blue-100 transition-all active:scale-95 flex gap-2 cursor-pointer">
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-slate-100 shadow-lg rounded-2xl bg-white overflow-hidden">
        <CardHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-[#0064cb]" />
              </div>
              Profile Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">First Name</Label>
              {isEditing ? (
                <Input
                  placeholder="Enter first name"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 text-sm font-medium transition-all"
                />
              ) : (
                <p className="text-[14px] font-medium text-slate-700">{currentUser.first_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Last Name</Label>
              {isEditing ? (
                <Input
                  placeholder="Enter last name"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 text-sm font-medium transition-all"
                />
              ) : (
                <p className="text-[14px] font-medium text-slate-700">{currentUser.last_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Email Address</Label>
              <div className="flex items-center gap-2 px-0.5">
                <p className="text-[14px] font-medium text-slate-700">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Phone Number</Label>
              {isEditing ? (
                <div className="relative flex items-center h-11 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0064cb]/10 focus-within:border-[#0064cb] transition-all">
                  {/* Country Code Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 h-full rounded-l-xl hover:bg-slate-100/50 border-r border-slate-200/80 transition-colors focus:outline-none cursor-pointer"
                  >
                    <img
                      src={`https://flagcdn.com/w20/${selectedCountry.code}.png`}
                      alt={selectedCountry.name}
                      className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                    />
                    <span className="text-sm font-semibold text-slate-700">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Phone Input */}
                  <div className="relative flex-1 h-full flex items-center">
                    <Phone className="absolute left-3 w-4 h-4 text-slate-700" />
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={editFormData.phone_number}
                      onChange={(e) => {
                        // Allow only digits
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                        setEditFormData(prev => ({ ...prev, phone_number: digits }));
                      }}
                      className="w-full h-full bg-transparent outline-none border-none pl-9 pr-3 text-slate-800 font-medium placeholder-slate-400 text-sm"
                    />
                  </div>

                  {/* Backdrop/Overlay for closing dropdown when clicking outside */}
                  {isDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  )}

                  {/* Country Dropdown list */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in duration-100">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedCountry.code === country.code ? "bg-blue-50/30 font-semibold text-[#0064cb]" : "text-slate-700"
                          }`}
                        >
                          <img
                            src={`https://flagcdn.com/w20/${country.code}.png`}
                            alt={country.name}
                            className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                          />
                          <span className="flex-1 truncate font-medium">{country.name}</span>
                          <span className="text-slate-700 text-xs font-semibold">{country.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-0.5">
                  {(() => {
                    const countryMatch = findCountryFromPhone(currentUser.phone_number || "");
                    if (countryMatch) {
                      const displayNum = (currentUser.phone_number || "").slice(countryMatch.dialCode.length);
                      return (
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w20/${countryMatch.code}.png`}
                            alt={countryMatch.name}
                            className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                          />
                          <span className="text-slate-700 font-semibold text-sm">{countryMatch.dialCode}</span>
                          <span className="text-[14px] font-medium text-slate-700">{displayNum}</span>
                        </div>
                      );
                    }
                    return <p className="text-[14px] font-medium text-slate-700">{currentUser.phone_number || "Not provided"}</p>;
                  })()}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="pt-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-700 uppercase">Security Credentials</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-800 uppercase">Old Password</Label>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter old password"
                      value={editFormData.old_password}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, old_password: e.target.value }))}
                      className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 pr-11 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-800 uppercase">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={editFormData.new_password}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, new_password: e.target.value }))}
                      className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 pr-11 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-700 font-medium">Leave passwords blank to keep current credentials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
