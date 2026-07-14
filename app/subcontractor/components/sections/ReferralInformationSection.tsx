"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormValues } from "../SubcontractorForm";

export function ReferralInformationSection() {
  const { control } = useFormContext<FormValues>();

  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-800">Referral Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <Label className="text-red-500 font-medium">How did you hear about us? *</Label>
          <Controller
            control={control}
            name="howHeard"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="max-w-full">
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
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
