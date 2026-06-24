"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormValues } from "../SubcontractorForm";

export function AdditionalInformationSection() {
  const { control } = useFormContext<FormValues>();

  const booleanQuestions = [
    {
      name: "onCallAcknowledge" as const,
      label: "Do you acknowledge this position is ON CALL?",
    },
    {
      name: "hasSmartphone" as const,
      label: "Do you currently own and use a smartphone?",
    },
    {
      name: "canRespondAlerts" as const,
      label: "Are you available and willing to promptly respond to job alerts, specifically within a 4-hour timeframe?",
    },
    {
      name: "hasSecurityLicense" as const,
      label: "Do you hold a valid security guard license as required for professional security work?",
    },
    {
      name: "canPassBackgroundCheck" as const,
      label: "Are you eligible to successfully pass a comprehensive background check as part of the employment screening process?",
    },
    {
      name: "hasReliableTransport" as const,
      label: "Do you have a reliable mode of transportation?",
    },
    {
      name: "unarmed" as const,
      label: "Do you hold a valid Unarmed security guard license as required for professional security work?",
    },
    {
      name: "armed" as const,
      label: "Do you hold a valid Armed security guard license as required for professional security work?",
    },
    {
      name: "english_language" as const,
      label: "Are you proficient in speaking English?",
    },
  ];

  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-800">Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {booleanQuestions.map((q) => (
          <div key={q.name} className="space-y-1">
            <Label className="text-slate-600 font-normal">
              {q.label}
              <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name={q.name}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value as string}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
