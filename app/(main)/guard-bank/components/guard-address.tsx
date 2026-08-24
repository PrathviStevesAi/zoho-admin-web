import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuardAddressProps {
  guard: any;
  isEditing: boolean;
  editForm: any;
  handleEditChange: (field: string, value: any) => void;
  countries: any[];
  states: any[];
  cities: any[];
  formErrors?: Record<string, string>;
}

export function GuardAddress({
  guard,
  isEditing,
  editForm,
  handleEditChange,
  countries,
  states,
  cities,
  formErrors
}: GuardAddressProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-2">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <MapPin className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Address</h3>
      </div>
      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
        <div className="col-span-2 space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Street Address</span>
          {isEditing ? <Input value={editForm.street_address || ""} onChange={e => handleEditChange("street_address", e.target.value)} className="h-10 text-sm mt-1" /> : <p className="text-[13px] font-bold text-slate-800 leading-relaxed">{guard.street_address || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Country {isEditing && <span className="text-red-500">*</span>}</span>
          {isEditing ? (
            <>
              <Select value={editForm.country || undefined} onValueChange={val => { handleEditChange("country", val); handleEditChange("state", ""); handleEditChange("city", ""); }}>
                <SelectTrigger className={cn("h-10 text-sm mt-1", formErrors?.country && "border-red-500 ring-1 ring-red-500")}>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors?.country && <p className="text-xs text-red-500 font-medium mt-1">{formErrors.country}</p>}
            </>
          ) : <p className="text-[13px] font-bold text-slate-800">{guard.country || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">State {isEditing && <span className="text-red-500">*</span>}</span>
          {isEditing ? (
            <>
              <Select value={editForm.state || undefined} onValueChange={val => { handleEditChange("state", val); handleEditChange("city", ""); }} disabled={!editForm.country}>
                <SelectTrigger className={cn("h-10 text-sm mt-1", formErrors?.state && "border-red-500 ring-1 ring-red-500")}>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors?.state && <p className="text-xs text-red-500 font-medium mt-1">{formErrors.state}</p>}
            </>
          ) : <p className="text-[13px] font-bold text-slate-800">{guard.state || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">City</span>
          {isEditing ? (
            <Select value={editForm.city || undefined} onValueChange={val => handleEditChange("city", val)} disabled={!editForm.state}>
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : <p className="text-[13px] font-bold text-slate-800">{guard.city || "N/A"}</p>}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Zip Code</span>
          {isEditing ? <Input value={editForm.zip_code || ""} onChange={e => {
            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
            if (val.length <= 10) handleEditChange("zip_code", val);
          }} className="h-10 text-sm mt-1" /> : <p className="text-[13px] font-bold text-slate-800">{guard.zip_code || "N/A"}</p>}
        </div>
      </div>
    </div>
  );
}
