"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Country, State, City } from "country-state-city";
import { toast } from "sonner";
import { ChevronDown, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import Image from "next/image";
import { verifySubcontractorApplicationAction, submitSubcontractorApplicationAction } from "@/actions/subcontractor.actions";

const ALLOWED_COUNTRIES = ["US", "CA", "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"];

const formSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  resume: z.any().optional(),
  license_number: z.string().min(3, "License number is required").max(50),
  expiration_date: z.string().min(1, "Expiration date is required"),

  headshot_image: z.any().optional(),
  security_guard_license: z.any().optional(),
  securityLicenseOptional: z.boolean().optional(),
  driver_license: z.any().optional(),
  firewatch_certificate: z.any().optional(),
  verificationVideo: z.any().optional(),

  firstName: z.string().min(2, "First name is required").max(100),
  lastName: z.string().min(2, "Last name is required").max(100),
  address: z.string().min(1, "Address is required").max(255),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip Code is required").max(15),
  phoneCode: z.string().min(1, "Code required"),
  phone: z.string().min(10, "Phone number required"),

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

  gender: z.string().min(1, "This field is required"),
  race: z.string().min(1, "This field is required"),

  veteranStatus: z.string().min(1, "This field is required"),
  disabilityStatus: z.string().min(1, "This field is required"),

  fullName: z.string().min(3, "Full Name is required").max(255),
});

type FormValues = z.infer<typeof formSchema>;

const phoneCountries = [
  { name: "Argentina", code: "ar", dialCode: "+54" },
  { name: "Bolivia", code: "bo", dialCode: "+591" },
  { name: "Brazil", code: "br", dialCode: "+55" },
  { name: "Canada", code: "ca", dialCode: "+1" },
  { name: "Chile", code: "cl", dialCode: "+56" },
  { name: "Colombia", code: "co", dialCode: "+57" },
  { name: "Ecuador", code: "ec", dialCode: "+593" },
  { name: "Guyana", code: "gy", dialCode: "+592" },
  { name: "Paraguay", code: "py", dialCode: "+595" },
  { name: "Peru", code: "pe", dialCode: "+51" },
  { name: "Suriname", code: "sr", dialCode: "+597" },
  { name: "United States", code: "us", dialCode: "+1" },
  { name: "Uruguay", code: "uy", dialCode: "+598" },
  { name: "Venezuela", code: "ve", dialCode: "+58" }
];

const CustomInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <Input ref={ref} className={`${className || ""}`} {...props} />
));
CustomInput.displayName = "CustomInput";

export default function SubcontractorForm() {
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoInstructions, setShowVideoInstructions] = useState(false);
  const [showRaceDefinitions, setShowRaceDefinitions] = useState(false);
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(phoneCountries[11]); // Default to US
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      securityLicenseOptional: false,
      phoneCode: "+1",
      privacyAccepted: false,
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
    },
  });

  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const isSecurityLicenseOptional = watch("securityLicenseOptional");
  const guardEmail = watch("email");
  const phoneValue = watch("phone");

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const hasVerificationError =
    (errors.email?.type === "manual") ||
    (errors.phone?.type === "manual");

  useEffect(() => {
    if (!guardEmail) {
      setIsEmailVerified(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      // Basic check to avoid calling API on clearly invalid emails
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardEmail)) {
        const res = await verifySubcontractorApplicationAction(guardEmail, "");
        if (!res.success) {
          setError("email", { type: "manual", message: res.error || "Email already exists" });
          setIsEmailVerified(false);
        } else {
          clearErrors("email");
          setIsEmailVerified(true);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [guardEmail, setError, clearErrors]);

  useEffect(() => {
    if (!phoneValue) {
      setIsPhoneVerified(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      if (phoneValue.length >= 10) {
        const res = await verifySubcontractorApplicationAction("", phoneValue);
        if (!res.success) {
          setError("phone", { type: "manual", message: res.error || "Phone already exists" });
          setIsPhoneVerified(false);
        } else {
          clearErrors("phone");
          setIsPhoneVerified(true);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [phoneValue, setError, clearErrors]);

  useEffect(() => {
    const allCountries = Country.getAllCountries().filter(c => ALLOWED_COUNTRIES.includes(c.isoCode));
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry));
      setValue("state", "");
      setValue("city", "");
    }
  }, [selectedCountry, setValue]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      setCities(City.getCitiesOfState(selectedCountry, selectedState));
      setValue("city", "");
    }
  }, [selectedState, selectedCountry, setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        email: data.email,
        phone_number: `${data.phoneCode}${data.phone}`,
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
        gender: data.gender,
        ethnicity: data.race,
        veteran_status: data.veteranStatus,
        disability_status: data.disabilityStatus,
      };

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
      {/* Logo Area */}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-red-500 font-medium">Email*</Label>
          <CustomInput
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          ) : isEmailVerified ? (
            <p className="text-xs text-green-600 flex items-center font-medium mt-1"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified</p>
          ) : null}
        </div>

        {/* Cell Phone */}
        <div className="space-y-1 relative">
          <Label className="text-slate-700 font-medium">Cell Phone<span className="text-red-500">*</span></Label>
          <div className="relative flex items-center h-10 bg-surface border border-border rounded-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-background transition-all">
            {/* Country Code Trigger */}
            <button
              type="button"
              onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
              className="flex items-center gap-1.5 px-3 h-full rounded-l-sm hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-border transition-colors focus:outline-none cursor-pointer"
            >
              <img
                src={`https://flagcdn.com/w20/${selectedPhoneCountry.code}.png`}
                alt={selectedPhoneCountry.name}
                className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedPhoneCountry.dialCode}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Phone Input */}
            <div className="relative flex-1 h-full flex items-center">
              <Phone className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter phone number"
                {...register("phone", {
                  onChange: (e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                    e.target.value = digits;
                    setIsPhoneVerified(false);
                  }
                })}
                className="w-full h-full bg-transparent outline-none border-none pl-9 pr-3 text-slate-900 dark:text-slate-100 font-medium placeholder:text-muted-foreground placeholder:font-normal text-sm"
              />
            </div>

            {/* Backdrop/Overlay */}
            {isPhoneDropdownOpen && (
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIsPhoneDropdownOpen(false)}
              />
            )}

            {/* Country Dropdown list */}
            {isPhoneDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-popover border border-border rounded-sm shadow-md z-50 animate-in fade-in duration-100">
                {phoneCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setSelectedPhoneCountry(country);
                      setValue("phoneCode", country.dialCode);
                      setIsPhoneDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer ${selectedPhoneCountry.code === country.code ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground"
                      }`}
                  >
                    <img
                      src={`https://flagcdn.com/w20/${country.code}.png`}
                      alt={country.name}
                      className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                    />
                    <span className="flex-1 truncate font-medium">{country.name}</span>
                    <span className="text-muted-foreground text-xs font-semibold">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.phone ? (
            <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
          ) : isPhoneVerified ? (
            <p className="text-xs text-green-600 flex items-center font-medium mt-1"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified</p>
          ) : null}
        </div>

        <fieldset disabled={hasVerificationError || isSubmitting} className={`space-y-6 ${hasVerificationError || isSubmitting ? "opacity-50 pointer-events-none transition-opacity" : ""}`}>
          {/* Resume Upload */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="mb-3">
              <h3 className="font-semibold text-slate-800">Upload Your Resume / CV <span className="text-red-500">*</span></h3>
              <p className="text-xs text-slate-500 mt-1">Documents must be in one of the following formats: <strong>DOC, DOCX, PDF</strong> and less than <strong>2MB</strong>.</p>
            </div>
            <div className="w-full max-w-[220px]">
              <FileUpload
                label=""
                accept=".doc,.docx,.pdf"
                maxSizeMB={2}
                onFileSelect={(file) => setValue("resume", file)}
                variant="button"
                buttonText="My computer"
                uploadType="resume"
                guardEmail={guardEmail}
              />
            </div>
          </div>

          {/* License & Expiration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="license_number" className="text-slate-700">Driving License Number<span className="text-red-500">*</span></Label>
              <CustomInput id="license_number" placeholder="Enter Driving license number" {...register("license_number")} />
              {errors.license_number && <p className="text-xs text-red-500">{errors.license_number.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiration_date" className="text-slate-700">Expiration Date<span className="text-red-500">*</span></Label>
              <CustomInput id="expiration_date" type="date" min={new Date().toISOString().split('T')[0]} {...register("expiration_date")} />
              {errors.expiration_date && <p className="text-xs text-red-500">{errors.expiration_date.message}</p>}
            </div>
          </div>

          {/* Documents & Credentials */}
          <Card className="shadow-none border-slate-200">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm font-medium text-slate-800 mb-4">
                Documents & Credentials: (Please upload each of the documents / images (JPG, JPEG formats only, max 2MB) requested below if you have the certifications. Failing to do so may delay or deny processing of your application)
              </p>

              <div className="space-y-3">
                <div className="w-full md:w-[350px]">
                  <FileUpload
                    label=""
                    helperText=""
                    accept=".jpg,.jpeg,image/jpeg"
                    maxSizeMB={2}
                    onFileSelect={(file) => setValue("headshot_image", file)}
                    variant="red-button"
                    buttonText="Upload HeadShot Image<span class='text-red-500'>*</span>"
                    uploadType="headshot-image"
                    guardEmail={guardEmail}
                  />
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-full md:w-[350px] shrink-0">
                    <FileUpload
                      label=""
                      helperText=""
                      accept=".jpg,.jpeg,image/jpeg"
                      maxSizeMB={2}
                      onFileSelect={(file) => setValue("security_guard_license", file)}
                      variant="red-button"
                      buttonText={`Upload Security Guard License${!isSecurityLicenseOptional ? "<span class='text-red-500'>*</span>" : ""}`}
                      uploadType="security-guard-license-image"
                      guardEmail={guardEmail}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Controller
                      control={control}
                      name="securityLicenseOptional"
                      render={({ field }) => (
                        <Checkbox id="securityLicenseOptional" checked={field.value as boolean} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="securityLicenseOptional" className="text-xs font-normal text-slate-600">Note: Mark if Security Guard License is not required in your state</Label>
                  </div>
                </div>

                <div className="w-full md:w-[350px]">
                  <FileUpload
                    label=""
                    helperText=""
                    accept=".jpg,.jpeg,image/jpeg"
                    maxSizeMB={2}
                    onFileSelect={(file) => setValue("driver_license", file)}
                    variant="red-button"
                    buttonText="Upload Driver License<span class='text-red-500'>*</span>"
                    uploadType="driver-license-image"
                    guardEmail={guardEmail}
                  />
                </div>

                <div className="w-full md:w-[350px]">
                  <FileUpload
                    label=""
                    helperText=""
                    accept=".jpg,.jpeg,image/jpeg"
                    maxSizeMB={2}
                    onFileSelect={(file) => setValue("firewatch_certificate", file)}
                    variant="red-button"
                    buttonText="Upload Firewatch Certificate"
                    isOptional={true}
                    uploadType="firewatch-certificate-image"
                    guardEmail={guardEmail}
                  />
                </div>

                <div className="w-full md:w-[350px]">
                  <FileUpload
                    label=""
                    helperText=""
                    accept=".mp4,.mov"
                    maxSizeMB={5}
                    onFileSelect={(file) => setValue("verificationVideo", file)}
                    variant="red-button"
                    buttonText="Upload Verification Video<span class='text-red-500'>*</span>"
                    uploadType="verification_video"
                    guardEmail={guardEmail}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowVideoInstructions(!showVideoInstructions)}
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Click here to read instructions for creating your video
                </button>

                {showVideoInstructions && (
                  <div className="mt-4 p-4 border border-slate-200 rounded-md bg-slate-50 text-sm">
                    <p className="mb-2">Please record a front-facing video (15-30 seconds) while wearing a black button-up shirt or a black 3-button polo.</p>
                    <p className="font-semibold mb-1">In the video, you MUST:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-700">
                      <li>Say your full name</li>
                      <li>Say how many years of security experience you have</li>
                      <li>Show your security license on camera and mention the license type</li>
                      <li>Make sure the video is front-facing (camera directly facing you)</li>
                      <li>Upload the video in one of the allowed formats: MP4 or MOV</li>
                      <li>The video should be less than 5MB</li>
                    </ul>
                    <div className="bg-green-50 p-3 rounded text-green-800 text-xs border border-green-100">
                      <strong>Note:</strong> Please upload all required documents and the verification video correctly. Do not upload unnecessary or incorrect files. If the wrong documents are uploaded, your application may be rejected.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">First Name<span className="text-red-500">*</span></Label>
                <CustomInput placeholder="Enter first name" {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">Last Name<span className="text-red-500">*</span></Label>
                <CustomInput placeholder="Enter last name" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">Street Address<span className="text-red-500">*</span></Label>
                <CustomInput placeholder="Enter street address" {...register("address")} />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">Country<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">State<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">City<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                      <SelectTrigger className="bg-slate-100/50">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-700 font-medium">Zip Code<span className="text-red-500">*</span></Label>
                <CustomInput placeholder="Enter zip code" {...register("zipCode")} />
              </div>
            </CardContent>
          </Card>

          {/* Referral Information */}
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

          {/* Additional Information */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Do you acknowledge this position is ON CALL?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="onCallAcknowledge"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Do you currently own and use a smartphone?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="hasSmartphone"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Are you available and willing to promptly respond to job alerts, specifically within a 4-hour timeframe?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="canRespondAlerts"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Do you hold a valid security guard license as required for professional security work?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="hasSecurityLicense"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Are you eligible to successfully pass a comprehensive background check as part of the employment screening process?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="canPassBackgroundCheck"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Do you have a reliable mode of transportation?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="hasReliableTransport"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Do you hold a valid Unarmed security guard license as required for professional security work?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="unarmed"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Do you hold a valid Armed security guard license as required for professional security work?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="armed"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="space-y-1">
                <Label className="text-slate-600 font-normal">Are you proficient in speaking English?<span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="english_language"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-700">By clicking the checkbox below, you agree to the terms of our privacy policy.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-sm text-blue-600 hover:underline cursor-pointer text-left w-fit block focus:outline-none">
                    Click here to read our Privacy Policy
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fast Guard Service - Candidate Privacy Notice</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 mt-2">
                    <p>Fast Guard Service is committed to respecting your online privacy and recognize your need for appropriate protection and management of any personally identifiable information ("Personal Information") you share with us.</p>

                    <p>Fast Guard Service is a "data controller". This means that we are responsible for deciding how we hold and use personal information about you. This privacy notice makes you aware of how and why your personal data will be used, namely for the purposes of the Fast Guard Service employment recruitment process, and how long it will usually be retained for. It provides you with certain information that must be provided under the General Data Protection Regulation ((EU) 2016/679).</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data protection principles</h3>
                    <p>We will comply with data protection law and principles, which means that your data will be:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Used lawfully, fairly and in a transparent way.</li>
                      <li>Collected only for valid purposes that we have clearly explained to you and not used in any way that is incompatible with those purposes.</li>
                      <li>Relevant to the purposes we have told you about and limited only to those purposes.</li>
                      <li>Accurate and kept up to date.</li>
                      <li>Kept only as long as necessary for the purposes we have told you about.</li>
                      <li>Kept securely.</li>
                    </ul>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">The kind of information we hold about you</h3>
                    <p>In connection with your application for work with us, we will collect, store, and use the following categories of personal information about you:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>The information you have provided to us in your curriculum vitae and cover letter.</li>
                      <li>The information you have provided on our application form, including name, title, address, telephone number, personal email address, employment history, qualifications.</li>
                      <li>Any information you provide to us during an interview.</li>
                    </ul>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">How is your personal information collected?</h3>
                    <p>We collect personal information about candidates from the following sources:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You, the candidate.</li>
                      <li>Recruitment agencies and vendors we have agreed terms in place with</li>
                      <li>Professional networking profile</li>
                      <li>Employees and others who refer you to us</li>
                    </ul>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">How we will use information about you?</h3>
                    <p>We will use the personal information we collect about you to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Assess your skills, qualifications, and suitability for the role.</li>
                      <li>Carry out background and reference checks, where applicable.</li>
                      <li>Communicate with you about the recruitment process.</li>
                      <li>Keep records related to our hiring processes.</li>
                      <li>Comply with legal or regulatory requirements.</li>
                    </ul>
                    <p>We also need to process your personal information to decide whether to enter into a contract of employment with you.</p>
                    <p>Having received your CV, cover letter and/or your application form, we will then process that information to decide whether you meet the basic requirements to be screened by our in-house recruitment team for the role. If you do, we will decide whether your application is strong enough to invite you for an interview, be it by telephone, in person or other electronic means. If we decide to engage you for an interview, we will use the information you provide to us at the interview to decide whether to offer you the role. If we decide to offer you the role, we will then take up references before confirming your appointment.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">If you fail to provide personal information</h3>
                    <p>If you fail to provide information when requested, which is necessary for us to consider your application (such as evidence of qualifications or work history), we will not be able to process your application successfully and we will not be able to take your application further.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Automated decision-making</h3>
                    <p>You will not be subject to decisions that will have a significant impact on you based solely on automated decision-making.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data sharing With third parties</h3>
                    <p>We will only share your personal information with the following third parties for the purposes of processing your application; this may involve sharing your information with other companies within our ownership group, if we consider they may have other relevant vacancies and only if you consent to such sharing.</p>
                    <p>All our third-party service providers and other entities in the group are required to take appropriate security measures to protect your personal information in line with our policies. We do not allow our third-party service providers to use your personal data for their own purposes. We only permit them to process your personal data for specified purposes and in accordance with our instructions.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data security</h3>
                    <p>We have put in place appropriate security measures to prevent your personal information from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal information to those employees, agents, contractors and other third parties who have a business need-to-know. They will only process your personal information on our instructions and they are subject to a duty of confidentiality.</p>
                    <p>We have put in place procedures to deal with any suspected data security breach and will notify you and any applicable regulator of a suspected breach where we are legally required to do so.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data retention (how long will you use my information for)</h3>
                    <p>We will retain your personal information for a period of X years after we have communicated to you our decision about whether to appoint you to the role. We will retain your personal information so that we can make you aware of any suitable alternative roles that arise during this period.</p>
                    <p>We further retain your personal information for that period so that we can show, in the event of a legal claim, that we have not discriminated against candidates on prohibited grounds and that we have conducted the recruitment exercise in a fair and transparent way. After this period, we will securely destroy your personal information in accordance with applicable laws and regulations.</p>
                    <p>If you would prefer that we did not retain your personal information, you can notify us at any time and we will delete your personal information.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Rights of access, correction, erasure, and restriction</h3>
                    <p>Under certain circumstances, by law you have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Request access to your personal information (commonly known as a "data subject access request"). This enables you to receive a copy of the personal information we hold about you and to check that we are lawfully processing it.</li>
                      <li>Request correction of the personal information that we hold about you. This enables you to have any incomplete or inaccurate information we hold about you corrected.</li>
                      <li>Request erasure of your personal information. This enables you to ask us to delete or remove personal information where there is no good reason for us continuing to process it. You also have the right to ask us to delete or remove your personal information where you have exercised your right to object to processing (see below).</li>
                      <li>Object to processing of your personal information where we are relying on a legitimate interest (or those of a third party) and there is something about your particular situation which makes you want to object to processing on this ground. You also have the right to object where we are processing your personal information for direct marketing purposes.</li>
                      <li>Request the restriction of processing of your personal information. This enables you to ask us to suspend the processing of personal information about you, for example if you want us to establish its accuracy or the reason for processing it.</li>
                    </ul>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Right to withdraw consent</h3>
                    <p>When you applied for this role, you provided consent to us processing your personal information for the purposes of the recruitment exercise. You have the right to withdraw your consent for processing for that purpose at any time.</p>
                    <p>To withdraw your consent, please contact the Recruitment Manager. Once we have received notification that you have withdrawn your consent, we will no longer process your application and, subject to our policies, we will dispose of your personal data securely.</p>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data protection officer</h3>
                    <p>We have appointed a data protection officer (DPO) to oversee compliance with this privacy notice. If you have any questions about this privacy notice or how we handle your personal information, please contact the DPO by email, at privacy@FastGuardService.com.</p>
                    <p>You have the right to make a complaint at any time to the Information Commissioner's Office (ICO), the UK supervisory authority for data protection issues.</p>
                  </div>
                  <div className="mt-6 flex justify-end sticky bottom-0 bg-background/95 backdrop-blur pt-2 pb-2">
                    <DialogClose asChild>
                      <Button type="button" className="px-8">Close</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-start space-x-2">
                <Controller
                  control={control}
                  name="privacyAccepted"
                  render={({ field }) => (
                    <Checkbox
                      id="privacyAccepted"
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  )}
                />
                <div className="space-y-1">
                  <Label htmlFor="privacyAccepted" className="text-sm font-normal text-red-500">I have read the terms of the privacy policy and consent to the processing of my information</Label>
                  {errors.privacyAccepted && <p className="text-xs text-red-500">{errors.privacyAccepted.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voluntary Self-Identification */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Voluntary Self-Identification</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <p className="text-sm text-slate-700 leading-relaxed">
                Qualified resume submissions are considered for employment without regard to race, religion, sex, national origin, marital status, sexual orientation, veteran status, or disability. Completion of this form is <strong>VOLUNTARY</strong> and your failure to complete it will <strong>NOT</strong> preclude you from employment consideration. This information will be kept in a confidential file separate from your resume.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-red-500 uppercase text-xs font-semibold">GENDER / GÉNERO*</Label>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="not-disclose">I choose Not To Disclose</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <button type="button" onClick={() => setShowRaceDefinitions(!showRaceDefinitions)} className="text-xs text-blue-600 hover:underline block pt-2 text-left focus:outline-none cursor-pointer">Click To View Race/Ethnicity Definitions</button>
                </div>

                <div className="space-y-2">
                  <Label className="text-red-500 uppercase text-xs font-semibold">RACE/ETHNICITY / RAZA/ETNICIDAD *</Label>
                  <Controller
                    control={control}
                    name="race"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="black">Black or African American</SelectItem>
                          <SelectItem value="hispanic-latino">Hispanic or Latino</SelectItem>
                          <SelectItem value="asian">Asian</SelectItem>
                          <SelectItem value="native-american">American Indian or Alaska Native</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="not-disclose">I choose Not To Disclose</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <button type="button" onClick={() => setShowRaceDefinitions(!showRaceDefinitions)} className="text-xs text-blue-600 hover:underline block pt-2 text-right md:text-left focus:outline-none w-full md:w-auto cursor-pointer">Haga clic para ver la raza / origen étnico Definiciones</button>
                </div>
              </div>

              {showRaceDefinitions && (
                <div className="mt-4 border border-slate-200 rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-700 overflow-hidden text-slate-700 dark:text-slate-300 text-sm animate-in fade-in duration-300">
                  <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Hispanic or Latino</h4>
                      <p className="text-xs mt-1">A person of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin regardless of race.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">American Indian or Alaska Native (Not Hispanic or Latino)</h4>
                      <p className="text-xs mt-1">A person having origins in any of the original peoples of North and South America (including Central America), and who maintain tribal affiliation or community attachment.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Asian (Not Hispanic or Latino)</h4>
                      <p className="text-xs mt-1">A person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian Subcontinent, including Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippines, Thailand, and Vietnam.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Black or African American (Not Hispanic or Latino)</h4>
                      <p className="text-xs mt-1">A person having origins in any of the black racial groups of Africa.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)</h4>
                      <p className="text-xs mt-1">A person having origins in any of the peoples of Hawaii, Guam, Samoa, or other Pacific Islands.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">White (Not Hispanic or Latino)</h4>
                      <p className="text-xs mt-1">A person having origins in any of the original peoples of Europe, the Middle East, or North Africa.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Two or More Races (Not Hispanic or Latino)</h4>
                      <p className="text-xs mt-1">Persons who identify with two or more race/ethnicity categories named above.</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Hispano o Latino</h4>
                      <p className="text-xs mt-1">Una persona de cultura Cubana, Mexicana, Puertorriqueña, América del Sur o Central o de otra cultura hispana u origen independiente de la raza.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Indígena Americano o Nativo de Alaska (No Hispano o Latino)</h4>
                      <p className="text-xs mt-1">Una persona con su origen en cualquiera de la gente original de la América del Norte y del Sur (incluyendo la América Central) y que mantenga una afiliación tribal o asociación comunitaria.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Asiático (No Hispano o Latino)</h4>
                      <p className="text-xs mt-1">Una persona con su origen en cualquiera de la gente del Oriente Medio, Sudeste Asiático o el Subcontinente Indio incluyendo Cambodia, China, India, Japón, Corea, Malasia, Pakistán, las Islas Filipinas, Tailandia, y Vietnam.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Negro o Americano Africano (No Hispano o Latino)</h4>
                      <p className="text-xs mt-1">Una persona con su origen en cualquiera de los grupos raciales negros de África.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Nativo del Hawái o de Otras Islas del Pacífico (No Hispano o Latino)</h4>
                      <p className="text-xs mt-1">Una persona con su origen en cualquiera de la gente de Hawái, Guam, Samoa, u otra Isla del Pacífico.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Blanco (No Hispano o Latino)</h4>
                      <p className="text-xs mt-1">Una persona con su origen en personas de Europa, Oriente Medio o África del Norte.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Dos o más razas (No Hispano o Latino)</h4>
                      <p className="text-xs mt-1">Personas que se identifican con dos o más categorías de raza/etnicidad mencionadas arriba.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Veteran Status */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Veteran Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Controller
                control={control}
                name="veteranStatus"
                render={({ field }) => (
                  <div className="space-y-3">
                    {["YES I am a veteran", "NO I am not a veteran", "I choose to not disclose"].map((opt) => (
                      <div key={opt} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`vet-${opt}`}
                          name="veteranStatus"
                          value={opt}
                          checked={field.value === opt}
                          onChange={() => field.onChange(opt)}
                          className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`vet-${opt}`} className="text-red-400 font-normal">{opt}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.veteranStatus && <p className="text-xs text-red-500 mt-2">{errors.veteranStatus.message}</p>}
            </CardContent>
          </Card>

          {/* Disability Status */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Disability Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Controller
                control={control}
                name="disabilityStatus"
                render={({ field }) => (
                  <div className="space-y-3">
                    {["YES I have a disability", "NO I do not have a disability", "I choose to not disclose"].map((opt) => (
                      <div key={opt} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`dis-${opt}`}
                          name="disabilityStatus"
                          value={opt}
                          checked={field.value === opt}
                          onChange={() => field.onChange(opt)}
                          className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`dis-${opt}`} className="text-red-400 font-normal">{opt}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.disabilityStatus && <p className="text-xs text-red-500 mt-2">{errors.disabilityStatus.message}</p>}
            </CardContent>
          </Card>

          {/* Candidate Acknowledgment */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Candidate Acknowledgment</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                The information that I am submitting in this application is true and correct. I understand that in the event of my employment by the Company, I shall be subject to dismissal if any information that I have given in this application is false or misleading or if I have failed to give any information herein requested, regardless of the time elapsed after discovery.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                I understand that nothing in this employment application, the granting of an interview or my subsequent employment with the Company is intended to create an employment contract between myself and the Company under which my employment could be terminated only for cause.
              </p>

              <div className="space-y-1 pt-2">
                <Label htmlFor="fullName" className="text-red-500 font-medium">Type Your Full Name Here*</Label>
                <CustomInput id="fullName" placeholder="Enter your full name" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="text-sm text-blue-600 hover:underline block pt-2 text-left w-fit focus:outline-none cursor-pointer">
                Disclaimer - On-Call Job Policy
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium text-slate-800 dark:text-slate-200 border-b pb-4">Disclaimer &ndash; On-Call Job Policy</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 pt-2">
                <p className="font-semibold text-slate-900 dark:text-white">An on-call job means:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                  <li>You are not scheduled for fixed, regular hours like a full-time or part-time employee.</li>
                  <li>The company may contact you only when work is needed (for example, to cover a shift, handle an event, or fill in for someone).</li>
                  <li>Work hours may be irregular and unpredictable &mdash; some weeks you may be offered several shifts, while other weeks you may not be offered any.</li>
                  <li>You are expected to be available and ready on short notice, though the amount of notice depends on the employer's needs.</li>
                  <li>In security work, this often includes being called for special events, emergency coverage, or last-minute posts.</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex justify-center space-x-4 pt-6 pb-8">
            <Button type="submit" disabled={isSubmitting || hasVerificationError} className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded">
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
    </div>
  );
}

