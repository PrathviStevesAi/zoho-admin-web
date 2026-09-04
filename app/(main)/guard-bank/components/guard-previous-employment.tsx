import React from "react";
import { Briefcase } from "lucide-react";
import { FormattedDate } from "@/components/ui/formatted-date";

export function GuardPreviousEmployment({ guard }: { guard: any }) {
  const info = guard?.previous_employee_info;

  if (!info) return null;

  const hasData = Object.values(info).some(val => val !== null && val !== undefined && val !== "");
  if (!hasData) return null;

  const renderField = (label: string, value: any, isDate: boolean = false) => {
    return (
      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <p className="text-[14px] font-semibold text-slate-800">
          {value ? (
            isDate ? <FormattedDate date={value} includeTime={false} /> : (
              <span className="capitalize-first">{value}</span>
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
        {renderField("Employer Name", info.previous_employer_name)}
        {renderField("Position & Duties", info.previous_employer_position_and_duties)}
        {renderField("Start Date", info.previous_employment_start_date, true)}
        {renderField("End Date", info.previous_employment_end_date, true)}
        {renderField("Reason for Leaving", info.previous_employment_end_reason)}
        {renderField("Eligible for Rehire", info.previous_employer_rehire_eligible)}
      </div>
    </div>
  );
}
