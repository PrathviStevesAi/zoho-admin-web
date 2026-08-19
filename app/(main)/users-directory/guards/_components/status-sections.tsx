import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export function SelfIdSection({ formData, setFormData }: any) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Voluntary Self-Identification</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Gender</label>
          <Select
            value={formData.voluntaryGender || ""}
            onValueChange={(val) => setFormData({ ...formData, voluntaryGender: val })}
          >
            <SelectTrigger className="h-11 bg-slate-50/50">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Decline">I choose not to disclose</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Race / Ethnicity</label>
          <Select
            value={formData.raceEthnicity || ""}
            onValueChange={(val) => setFormData({ ...formData, raceEthnicity: val })}
          >
            <SelectTrigger className="h-11 bg-slate-50/50">
              <SelectValue placeholder="Select race / ethnicity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hispanic">Hispanic or Latino</SelectItem>
              <SelectItem value="White">White (Not Hispanic or Latino)</SelectItem>
              <SelectItem value="Black">Black or African American</SelectItem>
              <SelectItem value="Asian">Asian</SelectItem>
              <SelectItem value="Native">Native American</SelectItem>
              <SelectItem value="Decline">I choose not to disclose</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function VeteranStatusSection({ formData, setFormData }: any) {
  const options = [
    { label: "Yes, I am a veteran", value: "yes" },
    { label: "No, I am not a veteran", value: "no" },
    { label: "I choose not to disclose", value: "decline" }
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Veteran Status</h3>

      <div className="space-y-3">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="veteranStatus"
              value={opt.value}
              checked={formData.veteranStatus === opt.value}
              onChange={() => setFormData({ ...formData, veteranStatus: opt.value })}
              className="hidden"
            />
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.veteranStatus === opt.value ? "border-[#0064cb] bg-[#0064cb]" : "border-slate-300 group-hover:border-[#0064cb]"
              }`}>
              {formData.veteranStatus === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <span className="text-[12px] font-semibold text-slate-700">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function DisabilityStatusSection({ formData, setFormData }: any) {
  const options = [
    { label: "Yes, I have a disability", value: "yes" },
    { label: "No, I do not have a disability", value: "no" },
    { label: "I choose not to disclose", value: "decline" }
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Disability</h3>

      <div className="space-y-3">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="disabilityStatus"
              value={opt.value}
              checked={formData.disabilityStatus === opt.value}
              onChange={() => setFormData({ ...formData, disabilityStatus: opt.value })}
              className="hidden"
            />
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.disabilityStatus === opt.value ? "border-[#0064cb] bg-[#0064cb]" : "border-slate-300 group-hover:border-[#0064cb]"
              }`}>
              {formData.disabilityStatus === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <span className="text-[12px] font-semibold text-slate-700">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}


