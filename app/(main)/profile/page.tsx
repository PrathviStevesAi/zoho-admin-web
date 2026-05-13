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
  ChevronRight,
  LogOut,
  Eye,
  EyeOff
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    old_password: "",
    new_password: "",
    profile_img_url: ""
  });

  const isFormChanged = user ? (
    editFormData.first_name !== user.first_name ||
    editFormData.last_name !== user.last_name ||
    editFormData.phone_number !== (user.phone_number || "") ||
    editFormData.old_password !== "" ||
    editFormData.new_password !== ""
  ) : false;

  const loadProfile = async () => {
    setLoading(true);
    const res = await fetchProfileAction();
    console.log("fetchProfileAction Response:", res);
    if (res.success && res.data) {
      setUser(res.data);
      setEditFormData({
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        phone_number: res.data.phone_number || "",
        old_password: "",
        new_password: "",
        profile_img_url: res.data.profile_img_url || ""
      });
    } else {
      // Fallback placeholder data if API fails
      setUser({
        first_name: "Guest",
        last_name: "User",
        email: "guest@example.com",
        phone_number: "Not available",
        role: "guest",
        profile_img_url: "",
      } as any);
      toast.error(res.error || "Failed to load profile, showing guest view");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    const payload: any = {
      first_name: editFormData.first_name,
      last_name: editFormData.last_name,
      phone_number: editFormData.phone_number,
    };

    if (editFormData.profile_img_url) {
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
        setUser(refreshed.data);
      }
    } else {
      toast.error(res.error || "Failed to update profile");
    }
    setIsUpdating(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdating(true);

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const uniqueId = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
      const uniqueFileName = `${fileNameWithoutExt}_${uniqueId}.${fileExt}`;

      console.log("generateUploadUrlAction Payload:", { file_name: uniqueFileName, type: "profile" });
      const res = await generateUploadUrlAction(uniqueFileName, "profile");
      console.log("generateUploadUrlAction Response:", res);

      if (!res.success || !res.data) throw new Error(res.error || "Failed to generate upload URL");

      const { signed_url, file_path } = res.data;
      console.log("Uploading file to:", signed_url);
      const uploadRes = await fetch(signed_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
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
        const refreshed = await fetchProfileAction();
        if (refreshed.success && refreshed.data) setUser(refreshed.data);
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
      <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Ensure we have a user object to avoid null reference errors
  const currentUser = user || {
    first_name: "Guest",
    last_name: "User",
    email: "not-available@gmail.com",
    phone_number: "None",
    role: "guest",
    profile_img_url: ""
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 px-2">
        <div className="relative group">
          <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-white shadow-lg rounded-2xl bg-slate-50 overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
            <AvatarImage src={currentUser.profile_img_url || undefined} className="object-cover" />
            <AvatarFallback className="text-3xl font-bold bg-slate-100 text-[#0064cb]">
              {currentUser.first_name[0]}{currentUser.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
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
          <p className="text-slate-400 font-medium text-sm flex items-center justify-center md:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {currentUser.email}
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="px-5 h-9 rounded-lg font-bold border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
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
        <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-[#0064cb]" />
              </div>
              Profile Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-bold text-black-700 uppercase">First Name</Label>
              {isEditing ? (
                <Input
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 text-sm font-medium transition-all"
                />
              ) : (
                <p className="text-base font-bold text-slate-500">{currentUser.first_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-bold text-black-700 uppercase">Last Name</Label>
              {isEditing ? (
                <Input
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 text-sm font-medium transition-all"
                />
              ) : (
                <p className="text-base font-bold text-slate-500">{currentUser.last_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-bold text-black-700 uppercase">Email Address</Label>
              <div className="flex items-center gap-2 px-0.5">
                <p className="text-base font-bold text-slate-500">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-bold text-black-700 uppercase">Phone Number</Label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={editFormData.phone_number}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl pl-10 pr-4 text-sm font-medium transition-all"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-0.5">
                  <p className="text-base font-bold text-slate-500">{currentUser.phone_number || "Not provided"}</p>
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
                  <Label className="text-[11px] font-bold text-black-700 uppercase">Old Password</Label>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={editFormData.old_password}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, old_password: e.target.value }))}
                      className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 pr-11 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-black-700 uppercase">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={editFormData.new_password}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, new_password: e.target.value }))}
                      className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl px-4 pr-11 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400 font-medium">Leave passwords blank to keep current credentials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
