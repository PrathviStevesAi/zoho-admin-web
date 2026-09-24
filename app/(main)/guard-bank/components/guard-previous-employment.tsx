import React from "react";
import { Briefcase } from "lucide-react";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GuardPreviousEmploymentProps {
  guard: any;
  isEditing?: boolean;
  editForm?: any;
  handleEditChange?: (field: string, value: any) => void;
}

export function GuardPreviousEmployment({ guard, isEditing, editForm, handleEditChange }: GuardPreviousEmploymentProps) {
  const info = guard?.previous_employee_info;

  if (!info && !isEditing) return null;

  const hasData = info && Object.values(info).some(val => val !== null && val !== undefined && val !== "");
  if (!hasData && !isEditing) return null;

  const renderField = (label: string, fieldKey: string, isDate: boolean = false, type: "text" | "select" | "textarea" = "text", options: { label: string, value: string }[] = []) => {
    const originalValue = info?.[fieldKey];
    const currentValue = editForm?.[fieldKey] !== undefined ? editForm[fieldKey] : originalValue;

    if (isEditing) {
      return (
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-700">{label}</p>
          {type === "textarea" ? (
            <textarea
              value={currentValue || ""}
              onChange={(e) => handleEditChange?.(fieldKey, e.target.value)}
              placeholder={`Enter ${label}...`}
              className="flex min-h-[100px] w-full rounded-sm border border-border bg-surface px-3 py-2 text-md text-slate-900 font-medium ring-offset-background placeholder:text-muted-foreground placeholder:text-sm placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          ) : type === "text" ? (
            <Input
              type={isDate ? "date" : "text"}
              value={currentValue || ""}
              onChange={(e) => handleEditChange?.(fieldKey, e.target.value)}
              placeholder={isDate ? undefined : `Enter ${label}`}
              className="h-10 text-[14px]"
            />
          ) : (
            <Select
              value={currentValue || ""}
              onValueChange={(val) => handleEditChange?.(fieldKey, val)}
            >
              <SelectTrigger className="h-10 text-[14px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <p className="text-[14px] font-semibold text-slate-800">
          {originalValue ? (
            isDate ? <FormattedDate date={originalValue} includeTime={false} /> : (
              <span className="capitalize-first">{originalValue}</span>
            )
          ) : (
            <span className="text-slate-400 font-normal italic">Not provided</span>
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-3">
      <div className="flex items-center gap-2 text-[#0064cb]">
        <Briefcase className="w-4 h-4" />
        <h3 className="font-bold text-slate-800 text-[14px]">Previous Employment Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        {renderField("Employer Name", "previous_employer_name")}
        {renderField("Position & Duties", "previous_employer_position_and_duties", false, "textarea")}
        {renderField("Start Date", "previous_employment_start_date", true)}
        {renderField("End Date", "previous_employment_end_date", true)}
        {renderField("Reason for Leaving", "previous_employment_end_reason", false, "textarea")}
        {renderField("Eligible for Rehire", "previous_employer_rehire_eligible", false, "select", [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ])}
      </div>
    </div>
  );
}
