import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export function AdditionalInfoSection({ formData, setFormData }: any) {
  const fields = [
    { label: "On Call Acknowledged?", key: "onCall" },
    { label: "Own & Use Smartphone?", key: "smartphone" },
    { label: "Respond in 4 Hours?", key: "respond4hr" },
    { label: "Hold SG License?", key: "holdSgLicense" },
    { label: "Pass Background Check?", key: "passBgCheck" },
    { label: "Reliable Transportation?", key: "reliableTransport" },
    { label: "Hold Unarmed License?", key: "holdUnarmedLicense" },
    { label: "Hold Armed License?", key: "holdArmedLicense" },
    { label: "English Proficiency?", key: "englishProficiency" },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Additional Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{field.label}</label>
            <Select
              value={formData[field.key] || ""}
              onValueChange={(val) => setFormData({ ...formData, [field.key]: val })}
            >
              <SelectTrigger className="h-11 bg-slate-50/50">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
