"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PersonalInfoSection } from "./personal-info-section";
import { DocumentsSection } from "./documents-section";
import { AdditionalInfoSection } from "./additional-info-section";
import {
  SelfIdSection,
  VeteranStatusSection,
  DisabilityStatusSection
} from "./status-sections";
import { registerGuardAction } from "@/actions/auth.actions";

export function GuardRegistrationForm({ onBack, countries }: any) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[11]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    addressCountry: "",
    addressState: "",
    city: "",
    zipCode: "",
    licenseNumber: "",
    licenseExpirationDate: "",
    gender: "",
    onCall: "",
    smartphone: "",
    respond4hr: "",
    holdSgLicense: "",
    passBgCheck: "",
    reliableTransport: "",
    holdUnarmedLicense: "",
    holdArmedLicense: "",
    englishProficiency: "",
    voluntaryGender: "",
    raceEthnicity: "",
    veteranStatus: "",
    disabilityStatus: "",
    resumeFile: null,
    headshotFile: null,
    securityLicenseFile: null,
    driverLicenseFile: null,
    firewatchCertFile: null,
    videoFile: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasRequiredError = false;
    const newErrors: any = {};

    if (!formData.firstName) {
      newErrors.firstNameError = "First name is required";
      hasRequiredError = true;
    }
    if (!formData.lastName) {
      newErrors.lastNameError = "Last name is required";
      hasRequiredError = true;
    }
    if (!formData.email) {
      newErrors.emailError = "Email is required";
      hasRequiredError = true;
    }
    if (!formData.phone) {
      newErrors.phoneError = "Phone number is required";
      hasRequiredError = true;
    }

    if (hasRequiredError) {
      setFormData((prev: any) => ({ ...prev, ...newErrors }));
      toast.error("Please fill in all required personal information.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (formData.emailError || formData.phoneError) {
      toast.error("Please resolve the errors before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsRegistering(true);

    const formattedPhone = `${selectedCountry.dialCode}${formData.phone}`;

    const payload = {
      email: formData.email,
      phone_number: formattedPhone,
      license_number: formData.licenseNumber,
      license_expiration_date: formData.licenseExpirationDate,
      resume_url: typeof formData.resumeFile === 'string' ? formData.resumeFile : "",
      headshot_image_url: typeof formData.headshotFile === 'string' ? formData.headshotFile : "",
      security_guard_license_url: typeof formData.securityLicenseFile === 'string' ? formData.securityLicenseFile : "",
      driver_license_url: typeof formData.driverLicenseFile === 'string' ? formData.driverLicenseFile : "",
      firewatch_certificate_url: typeof formData.firewatchCertFile === 'string' ? formData.firewatchCertFile : "",
      verification_video_url: typeof formData.videoFile === 'string' ? formData.videoFile : "",
      first_name: formData.firstName,
      last_name: formData.lastName,
      street_address: formData.streetAddress,
      country: formData.addressCountry,
      state: formData.addressState,
      city: formData.city,
      zip_code: formData.zipCode,
      on_call: formData.onCall === "yes",
      smartphone: formData.smartphone === "yes",
      job_alerts: formData.respond4hr === "yes",
      license: formData.holdSgLicense === "yes",
      background: formData.passBgCheck === "yes",
      transport: formData.reliableTransport === "yes",
      unarmed: formData.holdUnarmedLicense === "yes",
      armed: formData.holdArmedLicense === "yes",
      english_language: formData.englishProficiency === "fluent",
      gender: formData.voluntaryGender,
      ethnicity: formData.raceEthnicity,
      veteran_status: formData.veteranStatus,
      disability_status: formData.disabilityStatus
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
    );

    const res = await registerGuardAction(cleanedPayload);

    if (res.success) {
      toast.success(res.data?.message || "Guard registered successfully!");
      onBack();
    } else {
      toast.error(res.error || "Guard registration failed");
    }

    setIsRegistering(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
          </div>
          Register New Guard
        </h2>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Guard List
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PersonalInfoSection
          formData={formData}
          setFormData={setFormData}
          countries={countries}
          selectedCountry={selectedCountry}
          setIsDropdownOpen={setIsDropdownOpen}
          isDropdownOpen={isDropdownOpen}
        />

        <AdditionalInfoSection
          formData={formData}
          setFormData={setFormData}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6 h-full">
            <DocumentsSection
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          <div className="flex flex-col gap-6 h-full">
            <SelfIdSection formData={formData} setFormData={setFormData} />
            <VeteranStatusSection formData={formData} setFormData={setFormData} />
            <DisabilityStatusSection formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            type="submit"
            disabled={isRegistering}
            className="cursor-pointer h-12 px-12 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 text-base"
          >
            {isRegistering ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : "Submit Registration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
