import { User, Mail, Phone, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormattedDate } from "@/components/ui/formatted-date";
import { cn } from "@/lib/utils";

interface GuardInfoProps {
  guard: any;
  isEditing?: boolean;
  editForm?: any;
  handleEditChange?: (field: string, value: any) => void;
}

export function GuardPersonalDetails({ guard, isEditing, editForm, handleEditChange }: GuardInfoProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-2">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <User className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Personal Details</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">First Name</span>
          {isEditing && handleEditChange ? <Input value={editForm.first_name || ""} onChange={e => handleEditChange("first_name", e.target.value)} className="h-10 text-sm mt-1" /> : <p className="text-[13px] font-bold text-slate-800">{guard.first_name || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Last Name</span>
          {isEditing && handleEditChange ? <Input value={editForm.last_name || ""} onChange={e => handleEditChange("last_name", e.target.value)} className="h-10 text-sm mt-1" /> : <p className="text-[13px] font-bold text-slate-800">{guard.last_name || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Full Name</span>
          <p className="text-[13px] font-bold text-slate-800">{`${guard.first_name || ""} ${guard.last_name || ""}`.trim() || "N/A"}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Gender</span>
          {isEditing && handleEditChange ? (
            <Select value={editForm.gender || undefined} onValueChange={val => handleEditChange("gender", val)}>
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="not-disclose">I choose Not To Disclose</SelectItem>
              </SelectContent>
            </Select>
          ) : <p className="text-[13px] font-bold text-slate-800 capitalize">{guard.gender || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Ethnicity</span>
          {isEditing && handleEditChange ? (
            <Select value={editForm.ethnicity || undefined} onValueChange={val => handleEditChange("ethnicity", val)}>
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="black">Black or African American</SelectItem>
                <SelectItem value="hispanic-latino">Hispanic or Latino</SelectItem>
                <SelectItem value="asian">Asian</SelectItem>
                <SelectItem value="native-american">American Indian or Alaska Native</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="not-disclose">I choose Not To Disclose</SelectItem>
              </SelectContent>
            </Select>
          ) : <p className="text-[13px] font-bold text-slate-800 capitalize">{guard.ethnicity || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Veteran Status</span>
          {isEditing && handleEditChange ? (
            <Select value={editForm.veteran_status || undefined} onValueChange={val => handleEditChange("veteran_status", val)}>
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES I am a veteran">YES I am a veteran</SelectItem>
                <SelectItem value="NO I am not a veteran">NO I am not a veteran</SelectItem>
                <SelectItem value="I choose to not disclose">I choose to not disclose</SelectItem>
              </SelectContent>
            </Select>
          ) : <p className="text-[13px] font-bold text-slate-800 capitalize">{guard.veteran_status || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Disability Status</span>
          {isEditing && handleEditChange ? (
            <Select value={editForm.disability_status || undefined} onValueChange={val => handleEditChange("disability_status", val)}>
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES I have a disability">YES I have a disability</SelectItem>
                <SelectItem value="NO I do not have a disability">NO I do not have a disability</SelectItem>
                <SelectItem value="I choose to not disclose">I choose to not disclose</SelectItem>
              </SelectContent>
            </Select>
          ) : <p className="text-[13px] font-bold text-slate-800 capitalize">{guard.disability_status || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block mb-1">Background Check consent?</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.background === true || editForm.background === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("background", val === "yes")}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.background === true || guard.background === "yes" ? "Yes" : "No"}</p>
          )}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block mb-1">Has Security License?</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.license === true || editForm.license === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("license", val === "yes")}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[13px] font-bold text-slate-800">{guard.license === true || guard.license === "yes" ? "Yes" : "No"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function GuardContactInfo({ guard }: { guard: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-1">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <Mail className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Contact Info</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 text-[#0064cb] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Email Address</span>
            <a href={`mailto:${guard.email}`} className="text-[13px] font-bold text-slate-800 hover:text-[#0064cb] block truncate">{guard.email || "N/A"}</a>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 text-[#0064cb] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Cell Phone</span>
            <a href={`tel:${guard.phone_number?.replace(/\s/g, '')}`} className="text-[13px] font-bold text-slate-800 hover:text-[#0064cb] block truncate">{guard.phone_number || "N/A"}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuardPreferences({ guard, isEditing, editForm, handleEditChange }: GuardInfoProps) {
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-3">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <Shield className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Preferences</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">On Call</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.on_call === true || editForm.on_call === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("on_call", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.on_call)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">Job Alerts</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.job_alerts === true || editForm.job_alerts === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("job_alerts", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.job_alerts)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">Smartphone</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.smartphone === true || editForm.smartphone === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("smartphone", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.smartphone)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">Transport</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.transport === true || editForm.transport === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("transport", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.transport)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">Armed Security</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.armed === true || editForm.armed === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("armed", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.armed)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">Unarmed Security</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.unarmed === true || editForm.unarmed === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("unarmed", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.unarmed)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-600 font-semibold">Speaking English</span>
          {isEditing && handleEditChange ? (
            <Select value={(editForm.english_language === true || editForm.english_language === "yes") ? "yes" : "no"} onValueChange={val => handleEditChange("english_language", val === "yes")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : getBadgeValue(guard.english_language)}
        </div>
        <div className="space-y-1 p-2">
          <span className="text-[11px] text-slate-500 font-semibold block">Referral</span>
          {isEditing && handleEditChange ? (
            <Select value={editForm.referral || undefined} onValueChange={val => handleEditChange("referral", val)}>
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advertisement">Advertisement</SelectItem>
                <SelectItem value="employee-referral">Employee Referral</SelectItem>
                <SelectItem value="job-board">Job Board</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="website">Our Website</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : <p className="text-[13px] font-bold text-slate-800">{guard.referral || "N/A"}</p>}
        </div>
        <div className="space-y-1 p-2">
          <span className="text-[11px] text-slate-500 font-semibold block">Driving License no.</span>
          {isEditing && handleEditChange ? <Input value={editForm.license_number || ""} onChange={e => handleEditChange("license_number", e.target.value)} className="h-10 text-sm mt-1" /> : <p className="text-[13px] font-bold text-slate-800">{guard.license_number || "N/A"}</p>}
        </div>
        <div className="space-y-1 p-2">
          <span className="text-[11px] text-slate-500 font-semibold block">License Expire Date</span>
          {isEditing && handleEditChange ? <Input type="date" min={new Date().toISOString().split('T')[0]} value={editForm.license_expiration_date ? editForm.license_expiration_date.split('T')[0] : ""} onChange={e => handleEditChange("license_expiration_date", e.target.value)} className="h-10 text-sm mt-1" /> : <p className="text-[13px] font-bold text-slate-800">
            {guard.license_expiration_date ? <FormattedDate date={guard.license_expiration_date} includeTime={false} /> : "N/A"}
          </p>}
        </div>
      </div>
    </div>
  );
}
