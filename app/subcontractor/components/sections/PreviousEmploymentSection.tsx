import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomInput } from "../CustomInput";
import { FormValues } from "../SubcontractorForm";


export function PreviousEmploymentSection() {
  const { register, control, formState: { errors } } = useFormContext<FormValues>();

  return (
    <>
      <Card className="shadow-none border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Previous Employment Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prevEmployerName" className="text-sm font-medium">1. What was the name of your most recent employer?*</Label>
            <CustomInput id="prevEmployerName" placeholder="Enter employer name" {...register("prevEmployerName")} />
            {errors.prevEmployerName && <p className="text-xs text-red-500">{errors.prevEmployerName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prevJobDuties" className="text-sm font-medium">2. What position did you hold, and what were your primary job duties?*</Label>
            <textarea
              id="prevJobDuties"
              placeholder="Describe your position and primary job duties"
              className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              {...register("prevJobDuties")}
            />
            {errors.prevJobDuties && <p className="text-xs text-red-500">{errors.prevJobDuties.message}</p>}
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">3. When did you work there?*</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prevStartDate" className="text-xs text-slate-600">Start Date</Label>
                <CustomInput type="date" id="prevStartDate" {...register("prevStartDate")} />
                {errors.prevStartDate && <p className="text-xs text-red-500">{errors.prevStartDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prevEndDate" className="text-xs text-slate-600">End Date</Label>
                <CustomInput type="date" id="prevEndDate" {...register("prevEndDate")} />
                {errors.prevEndDate && <p className="text-xs text-red-500">{errors.prevEndDate.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prevLeaveReason" className="text-sm font-medium">4. Why are you no longer employed there?*</Label>
            <textarea
              id="prevLeaveReason"
              placeholder="Explain why you are no longer employed there"
              className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              {...register("prevLeaveReason")}
            />
            {errors.prevLeaveReason && <p className="text-xs text-red-500">{errors.prevLeaveReason.message}</p>}
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium">5. Are you eligible for rehire by this employer?*</Label>
            <Controller
              control={control}
              name="prevEligibleRehire"
              render={({ field }) => (
                <div className="flex items-center space-x-6 mt-2">
                  {["Yes", "No", "Unsure"].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`rehire-${opt.toLowerCase()}`}
                        name="prevEligibleRehire"
                        value={opt.toLowerCase()}
                        checked={field.value === opt.toLowerCase()}
                        onChange={() => field.onChange(opt.toLowerCase())}
                        className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={`rehire-${opt.toLowerCase()}`} className="font-normal">{opt}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {errors.prevEligibleRehire && <p className="text-xs text-red-500 mt-2">{errors.prevEligibleRehire.message}</p>}
          </div>

          <div className="flex items-start space-x-3 pt-6 mt-6 border-t border-slate-100">
            <input
              type="checkbox"
              id="certifyTrue"
              {...register("certifyTrue")}
              className="w-4 h-4 mt-1 border-slate-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
            />
            <div className="space-y-1">
              <Label htmlFor="certifyTrue" className="text-sm font-normal text-slate-700 leading-relaxed cursor-pointer block">
                I certify that the employment information provided above is true, complete, and accurate to the best of my knowledge. I understand that false statements, omissions, or misrepresentations may result in the rejection of my application or termination of employment if I am hired.
              </Label>
              {errors.certifyTrue && <p className="text-xs text-red-500 mt-1">{errors.certifyTrue.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
