"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { submitSubcontractorApplicationAction } from "@/actions/subcontractor.actions";
import { EmailAndPhoneSection } from "./sections/EmailAndPhoneSection";
import { ContactInformationSection } from "./sections/ContactInformationSection";
import { LicenseExpirationSection } from "./sections/LicenseExpirationSection";
import { DocumentsCredentialsSection } from "./sections/DocumentsCredentialsSection";
import { ReferralInformationSection } from "./sections/ReferralInformationSection";
import { AdditionalInformationSection } from "./sections/AdditionalInformationSection";
import { VoluntarySelfIdSection } from "./sections/VoluntarySelfIdSection";

const formSchema = z.object({
  email: z.string().trim().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email address").max(255),
  resume: z.any().optional(),
  license_number: z.string().trim().min(3, "License number is required").max(15, "License number cannot exceed 15 characters").regex(/^[A-Za-z0-9]+$/, "License number must be alphanumeric").toUpperCase(),
  expiration_date: z.string().min(1, "Expiration date is required"),
  headshot_image: z.any().optional(),
  security_guard_license: z.any().optional(),
  securityLicenseOptional: z.boolean().optional(),
  driver_license: z.any().optional(),
  firewatch_certificate: z.any().optional(),
  verificationVideo: z.any().optional(),
  firstName: z.string().trim().min(2, "First name is required").max(100).regex(/^[a-zA-Z\s\-']+$/, "First name can only contain alphabets"),
  lastName: z.string().trim().min(2, "Last name is required").max(100).regex(/^[a-zA-Z\s\-']+$/, "Last name can only contain alphabets"),
  address: z.string().trim().min(1, "Address is required").max(255),
  country: z.string().trim().min(1, "Country is required"),
  state: z.string().trim().min(1, "State is required"),
  city: z.string().trim().min(1, "City is required"),
  zipCode: z.string().trim().min(1, "Zip Code is required").max(10, "Zip Code cannot exceed 10 characters").regex(/^[a-zA-Z0-9]+$/, "Zip Code can only contain letters and numbers"),
  phoneCode: z.string().min(1, "Code required"),
  phone: z.string().trim().min(10, "Phone number required"),
  howHeard: z.string().min(1, "This field is required"),
  onCallAcknowledge: z.string().min(1, "This field is required"),
  hasSmartphone: z.string().min(1, "This field is required"),
  canRespondAlerts: z.string().min(1, "This field is required"),
  hasSecurityLicense: z.string().min(1, "This field is required"),
  canPassBackgroundCheck: z.string().min(1, "This field is required"),
  hasReliableTransport: z.string().min(1, "This field is required"),
  unarmed: z.string().min(1, "This field is required"),
  armed: z.string().min(1, "This field is required"),
  english_language: z.string().min(1, "This field is required"),
  privacyAccepted: z.boolean().refine(val => val === true, { message: "You must accept the privacy policy" }),
  smsNotifications: z.boolean().optional(),
  gender: z.string().min(1, "This field is required"),
  race: z.string().min(1, "This field is required"),
  veteranStatus: z.string().min(1, "This field is required"),
  disabilityStatus: z.string().min(1, "This field is required"),
  prevEmployerName: z.string().min(1, "Employer name is required"),
  prevJobDuties: z.string().min(1, "Job duties are required"),
  prevStartDate: z.string().min(1, "Start date is required"),
  prevEndDate: z.string().min(1, "End date is required"),
  prevLeaveReason: z.string().min(1, "Reason for leaving is required"),
  prevEligibleRehire: z.string().min(1, "This field is required"),
  certifyTrue: z.boolean().refine(val => val === true, { message: "You must certify the employment information" }),
  fullName: z.string().min(3, "Full Name is required").max(255),
});

export type FormValues = z.infer<typeof formSchema>;

const getPayload = (data: FormValues) => {
  return {
    email: data.email,
    phone_number: `${data.phoneCode}${data.phone}`.replace(/\s+/g, ""),
    license_number: data.license_number,
    license_expiration_date: data.expiration_date,
    resume_url: typeof data.resume === "string" ? data.resume : "",
    headshot_image_url: typeof data.headshot_image === "string" ? data.headshot_image : "",
    security_guard_license_url: typeof data.security_guard_license === "string" ? data.security_guard_license : "",
    driver_license_url: typeof data.driver_license === "string" ? data.driver_license : "",
    firewatch_certificate_url: typeof data.firewatch_certificate === "string" ? data.firewatch_certificate : "",
    verification_video_url: typeof data.verificationVideo === "string" ? data.verificationVideo : "",
    first_name: data.firstName,
    last_name: data.lastName,
    street_address: data.address,
    country: data.country,
    state: data.state,
    city: data.city,
    zip_code: data.zipCode,
    referral: data.howHeard,
    on_call: data.onCallAcknowledge === "yes",
    smartphone: data.hasSmartphone === "yes",
    job_alerts: data.canRespondAlerts === "yes",
    license: data.hasSecurityLicense === "yes",
    background: data.canPassBackgroundCheck === "yes",
    transport: data.hasReliableTransport === "yes",
    unarmed: data.unarmed === "yes",
    armed: data.armed === "yes",
    english_language: data.english_language === "yes",
    previous_employer_name: data.prevEmployerName,
    previous_employer_position_and_duties: data.prevJobDuties,
    previous_employment_start_date: data.prevStartDate,
    previous_employment_end_date: data.prevEndDate,
    previous_employment_end_reason: data.prevLeaveReason,
    previous_employer_rehire_eligible: data.prevEligibleRehire,
    gender: data.gender,
    ethnicity: data.race,
    veteran_status: data.veteranStatus,
    disability_status: data.disabilityStatus,
    sms_notifications: data.smsNotifications || false,
  };
};

export default function SubcontractorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      securityLicenseOptional: false,
      phoneCode: "+1",
      privacyAccepted: false,
      smsNotifications: false,
      resume: "",
      headshot_image: "",
      security_guard_license: "",
      driver_license: "",
      firewatch_certificate: "",
      verificationVideo: "",
      country: "",
      state: "",
      city: "",
      gender: "",
      race: "",
      veteranStatus: "",
      disabilityStatus: "",
      howHeard: "",
      onCallAcknowledge: "",
      hasSmartphone: "",
      canRespondAlerts: "",
      hasSecurityLicense: "",
      canPassBackgroundCheck: "",
      hasReliableTransport: "",
      unarmed: "",
      armed: "",
      english_language: "",
      prevEmployerName: "",
      prevJobDuties: "",
      prevStartDate: "",
      prevEndDate: "",
      prevLeaveReason: "",
      prevEligibleRehire: "",
      certifyTrue: false,
    },
  });

  const { handleSubmit, formState: { errors } } = methods;
  const hasVerificationError =
    (errors.email?.type === "manual") ||
    (errors.phone?.type === "manual");

  const onSubmit = async (data: FormValues) => {
    if (
      !data.resume ||
      !data.headshot_image ||
      (!data.securityLicenseOptional && !data.security_guard_license) ||
      !data.driver_license ||
      !data.verificationVideo
    ) {
      toast.error("Please upload all required documents and credentials.");
      const element = document.getElementById("documents-credentials-section");
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = getPayload(data);

      console.log("Submitting payload:", payload);
      const res = await submitSubcontractorApplicationAction(payload);
      console.log("Submit API response:", res);

      if (!res.success) {
        toast.error(res.error || "Failed to submit application");
        return;
      }

      toast.success("Application submitted successfully!");

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error("An error occurred while submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <Image
          src="/images/website-logo.png"
          alt="Fast Guard Security Service"
          width={250}
          height={60}
          className="object-contain"
          priority
          style={{ width: "auto", height: "auto" }}
        />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">Security Guard Armed/Unarmed</h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <EmailAndPhoneSection />
          <fieldset disabled={hasVerificationError || isSubmitting} className={`space-y-6 ${hasVerificationError || isSubmitting ? "opacity-50 pointer-events-none transition-opacity" : ""}`}>
            <LicenseExpirationSection />
            <DocumentsCredentialsSection />
            <ContactInformationSection />
            <ReferralInformationSection />
            <AdditionalInformationSection />
            <VoluntarySelfIdSection />
            <div className="flex justify-center space-x-4 pt-6 pb-8">
              <Button
                type="submit"
                disabled={isSubmitting || hasVerificationError}
                className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={() => {
                  const currentValues = methods.getValues();
                  const payload = getPayload(currentValues);
                  console.log("Submit button clicked.");
                  console.log("Current form values:", currentValues);
                  console.log("Form payload:", payload);
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
              <Button type="button" variant="outline" className="px-8 bg-slate-500 hover:bg-slate-600 text-white border-0 rounded" onClick={() => window.location.reload()}>
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      </FormProvider>
    </div>
  );
}
