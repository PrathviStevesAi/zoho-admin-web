"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clientFetchCustomerByIdAction, updateCustomerAction } from "@/lib/client-actions";
import { State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "@/app/subcontractor/components/StaticData";
import { getSecurityServiceStatesAction } from "@/actions/quote.actions";
import { toast } from "sonner";
import {
  ChevronRight,
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Info,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const countries = [
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
  { name: "Venezuela", code: "ve", dialCode: "+58" },
];

const ALLOWED_COUNTRIES: Record<string, string> = {
  US: "United States",
};

const DEFAULT_SERVICES = [
  { id: 1, name: "Armed Security" },
  { id: 2, name: "Body Guard Armed" },
  { id: 3, name: "Fire Watch Guard" },
  { id: 4, name: "Unarmed Security" },
  { id: 5, name: "Body Guard Unarmed" },
  { id: 6, name: "Body Guard with Suit" },
  { id: 7, name: "Employee Termination / Work Place Separation Security" },
];

function parsePhone(rawPhone: string) {
  if (!rawPhone) return { country: countries[11], digits: "" };
  const trimmed = rawPhone.trim();
  const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const matched = sortedCountries.find((c) => trimmed.startsWith(c.dialCode));
  if (matched) {
    const digits = trimmed.slice(matched.dialCode.length).replace(/\D/g, "");
    return { country: matched, digits };
  }
  return { country: countries[11], digits: trimmed.replace(/\D/g, "") };
}

function CustomerViewContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const searchParams = useSearchParams();
  const zohoCustomerId = searchParams.get("customer_id");

  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(countries[11]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_digits: "",
    billing_street: "",
    billing_city: "",
    billing_state: "",
    billing_zip: "",
    billing_country: "US",
    service_street: "",
    service_city: "",
    service_state: "",
    service_zip: "",
    service_country: "US",
    billing_type: "regular",
    net_terms_days: "",
    security_service_price: {} as Record<string, number>,
    sameAsBilling: false,
  });

  const [dynamicStates, setDynamicStates] = useState<{ id: number; state: string }[]>([]);

  useEffect(() => {
    getSecurityServiceStatesAction().then((res) => {
      if (res.success && res.data) {
        setDynamicStates(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    setIsLoading(true);
    const res = await clientFetchCustomerByIdAction(customerId, zohoCustomerId);
    if (!res.success) {
      toast.error(res.error || "Failed to load customer details");
    } else if (res.data) {
      const data = res.data;
      setCustomerData(data);

      const parsedPhone = parsePhone(data.phone_number || "");
      setSelectedCountry(parsedPhone.country);
      const initialPrices: Record<string, number> = {};
      DEFAULT_SERVICES.forEach((s) => {
        initialPrices[s.name] = 0;
      });
      if (data.security_service_price && typeof data.security_service_price === "object") {
        Object.entries(data.security_service_price).forEach(([k, v]) => {
          initialPrices[k] = Number(v) || 0;
        });
      }

      setFormData({
        company_name: data.company_name || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_digits: parsedPhone.digits,
        billing_street: data.billing_address?.street || "",
        billing_city: data.billing_address?.city || "",
        billing_state: data.billing_address?.state || "",
        billing_zip: data.billing_address?.zip || "",
        billing_country: data.billing_address?.country === "United States" ? "US" : (data.billing_address?.country || "US"),
        service_street: data.service_address?.street || "",
        service_city: data.service_address?.city || "",
        service_state: data.service_address?.state || "",
        service_zip: data.service_address?.zip || "",
        service_country: data.service_address?.country === "United States" ? "US" : (data.service_address?.country || "US"),
        billing_type: data.billing_type === "net_term" ? "net_term" : "regular",
        net_terms_days: data.net_terms_days ? String(data.net_terms_days) : "",
        security_service_price: initialPrices,
        sameAsBilling:
          (data.billing_address?.street || "") === (data.service_address?.street || "") &&
          (data.billing_address?.city || "") === (data.service_address?.city || "") &&
          (data.billing_address?.state || "") === (data.service_address?.state || "") &&
          (data.billing_address?.zip || "") === (data.service_address?.zip || ""),
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (formData.sameAsBilling) {
      setFormData((prev) => ({
        ...prev,
        service_zip: prev.billing_zip,
        service_city: prev.billing_city,
        service_state: prev.billing_state,
        service_street: prev.billing_street,
        service_country: prev.billing_country,
      }));

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.service_street;
        delete newErrors.service_country;
        delete newErrors.service_state;
        delete newErrors.service_city;
        delete newErrors.service_zip;
        return newErrors;
      });
    }
  }, [
    formData.sameAsBilling,
    formData.billing_zip,
    formData.billing_city,
    formData.billing_state,
    formData.billing_street,
    formData.billing_country,
  ]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const currentFullPhone = formData.phone_digits
    ? `${selectedCountry.dialCode}${formData.phone_digits}`
    : "";

  const hasChanges = customerData
    ? formData.company_name !== (customerData.company_name || "") ||
    formData.first_name !== (customerData.first_name || "") ||
    formData.last_name !== (customerData.last_name || "") ||
    formData.email !== (customerData.email || "") ||
    currentFullPhone !== (customerData.phone_number || "") ||
    formData.billing_street !== (customerData.billing_address?.street || "") ||
    formData.billing_city !== (customerData.billing_address?.city || "") ||
    formData.billing_state !== (customerData.billing_address?.state || "") ||
    formData.billing_zip !== (customerData.billing_address?.zip || "") ||
    formData.service_street !== (customerData.service_address?.street || "") ||
    formData.service_city !== (customerData.service_address?.city || "") ||
    formData.service_state !== (customerData.service_address?.state || "") ||
    formData.service_zip !== (customerData.service_address?.zip || "") ||
    formData.billing_type !== (customerData.billing_type === "net_term" ? "net_term" : "regular") ||
    formData.net_terms_days !== (customerData.net_terms_days ? String(customerData.net_terms_days) : "") ||
    JSON.stringify(formData.security_service_price) !== JSON.stringify(customerData.security_service_price || {})
    : false;

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.company_name) newErrors.company_name = "Company name is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.phone_digits) {
      const digitCount = formData.phone_digits.length;
      if (digitCount < 7 || digitCount > 15) {
        newErrors.phone = "Phone number must be between 7 and 15 digits";
      }
    }
    if (!formData.billing_type) newErrors.billing_type = "User type is required";
    if (formData.billing_type === "net_term" && !formData.net_terms_days) {
      newErrors.net_terms_days = "Net terms is required";
    }
    if (!formData.billing_street) newErrors.billing_street = "Street address is required";
    if (!formData.billing_country) newErrors.billing_country = "Country is required";
    if (!formData.billing_state) newErrors.billing_state = "State is required";
    if (!formData.billing_city) newErrors.billing_city = "City is required";
    if (!formData.billing_zip) newErrors.billing_zip = "ZIP code is required";
    if (!formData.sameAsBilling) {
      if (!formData.service_street) newErrors.service_street = "Street address is required";
      if (!formData.service_country) newErrors.service_country = "Country is required";
      if (!formData.service_state) newErrors.service_state = "State is required";
      if (!formData.service_city) newErrors.service_city = "City is required";
      if (!formData.service_zip) newErrors.service_zip = "ZIP code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all the required fields");
      return;
    }

    setErrors({});

    const payload: any = {};
    if (formData.company_name !== customerData.company_name) payload.company_name = formData.company_name;
    if (formData.first_name !== customerData.first_name) payload.first_name = formData.first_name;
    if (formData.last_name !== customerData.last_name) payload.last_name = formData.last_name;
    if (formData.email !== customerData.email) payload.email = formData.email;
    if (currentFullPhone !== (customerData.phone_number || "")) payload.phone_number = currentFullPhone;

    const billingChanged =
      formData.billing_street !== (customerData.billing_address?.street || "") ||
      formData.billing_city !== (customerData.billing_address?.city || "") ||
      formData.billing_state !== (customerData.billing_address?.state || "") ||
      formData.billing_zip !== (customerData.billing_address?.zip || "") ||
      formData.billing_country !== (customerData.billing_address?.country === "United States" ? "US" : (customerData.billing_address?.country || "US"));

    if (billingChanged) {
      payload.billing_address = {
        street: formData.billing_street,
        address: formData.billing_street,
        city: formData.billing_city,
        state: formData.billing_state,
        zip: formData.billing_zip,
        country: formData.billing_country === "US" ? "United States" : formData.billing_country,
      };
    }

    const serviceChanged =
      formData.service_street !== (customerData.service_address?.street || "") ||
      formData.service_city !== (customerData.service_address?.city || "") ||
      formData.service_state !== (customerData.service_address?.state || "") ||
      formData.service_zip !== (customerData.service_address?.zip || "") ||
      formData.service_country !== (customerData.service_address?.country === "United States" ? "US" : (customerData.service_address?.country || "US"));

    if (serviceChanged) {
      payload.service_address = {
        street: formData.service_street,
        address: formData.service_street,
        city: formData.service_city,
        state: formData.service_state,
        zip: formData.service_zip,
        country: formData.service_country === "US" ? "United States" : formData.service_country,
      };
    }

    if (formData.billing_type !== (customerData.billing_type || "")) payload.billing_type = formData.billing_type;

    const initialNetTerms = customerData.net_terms_days ? String(customerData.net_terms_days) : "";
    if (formData.net_terms_days !== initialNetTerms) {
      payload.net_terms_days = formData.net_terms_days ? Number(formData.net_terms_days) : 0;
    }

    if (JSON.stringify(formData.security_service_price) !== JSON.stringify(customerData.security_service_price || {})) {
      if (Object.keys(formData.security_service_price || {}).length > 0) {
        const sanitized: Record<string, number> = {};
        Object.entries(formData.security_service_price).forEach(([k, v]) => {
          sanitized[k] = Number(v) || 0;
        });
        payload.security_service_price = sanitized;
      } else {
        payload.security_service_price = null;
      }
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes made.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const res = await updateCustomerAction(customerId, payload, zohoCustomerId);
    setIsSaving(false);

    if (res.success) {
      toast.success("Customer updated successfully");
      setIsEditing(false);
      loadCustomer();
    } else {
      toast.error(res.error || "Failed to update customer");
    }
  };

  const handleCancel = () => {
    if (customerData) {
      const parsedPhone = parsePhone(customerData.phone_number || "");
      setSelectedCountry(parsedPhone.country);

      const initialPrices: Record<string, number> = {};
      DEFAULT_SERVICES.forEach((s) => {
        initialPrices[s.name] = 0;
      });
      if (customerData.security_service_price && typeof customerData.security_service_price === "object") {
        Object.entries(customerData.security_service_price).forEach(([k, v]) => {
          initialPrices[k] = Number(v) || 0;
        });
      }

      setFormData({
        company_name: customerData.company_name || "",
        first_name: customerData.first_name || "",
        last_name: customerData.last_name || "",
        email: customerData.email || "",
        phone_digits: parsedPhone.digits,
        billing_street: customerData.billing_address?.street || "",
        billing_city: customerData.billing_address?.city || "",
        billing_state: customerData.billing_address?.state || "",
        billing_zip: customerData.billing_address?.zip || "",
        billing_country: "US",
        service_street: customerData.service_address?.street || "",
        service_city: customerData.service_address?.city || "",
        service_state: customerData.service_address?.state || "",
        service_zip: customerData.service_address?.zip || "",
        service_country: "US",
        billing_type: customerData.billing_type === "net_term" ? "net_term" : "regular",
        net_terms_days: customerData.net_terms_days ? String(customerData.net_terms_days) : "",
        security_service_price: initialPrices,
        sameAsBilling:
          (customerData.billing_address?.street || "") === (customerData.service_address?.street || "") &&
          (customerData.billing_address?.city || "") === (customerData.service_address?.city || "") &&
          (customerData.billing_address?.state || "") === (customerData.service_address?.state || "") &&
          (customerData.billing_address?.zip || "") === (customerData.service_address?.zip || ""),
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const getInputClassName = (error?: string, hasLeftIcon?: boolean, isDisabled?: boolean) => {
    return cn(
      "h-12 bg-slate-50/50 rounded-xl transition-all text-slate-800 font-medium",
      hasLeftIcon ? "pl-11" : "",
      isDisabled ? "bg-slate-100/70 text-slate-600 disabled:opacity-100 cursor-default" : "",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
    );
  };

  const getSelectTriggerClassName = (error?: string, isDisabled?: boolean) => {
    return cn(
      "!h-12 bg-slate-50/50 rounded-xl transition-all text-slate-800 font-medium",
      isDisabled ? "bg-slate-100/70 text-slate-600 disabled:opacity-100 cursor-default" : "",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
    );
  };

  if (isLoading) {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
            <Skeleton className="h-4 w-20" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Skeleton className="h-4 w-24" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-8 w-60" />
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 font-medium">Customer not found.</p>
        <Button
          variant="outline"
          className="mt-4 cursor-pointer rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
          onClick={() => router.push("/users-directory/customers")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customer List
        </Button>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Users Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/users-directory/customers" className="text-slate-600 hover:text-[#0064cb] font-medium transition-colors">
            Customers
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/users-directory/customers"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Customers Directory</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? "Edit Customer" : "Customer Details"}
              </h2>
              {customerData.company_name && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">{customerData.company_name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl h-10 px-4"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="cursor-pointer bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all active:scale-95 h-10 px-5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/users-directory/customers")}
                  className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl h-10 px-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customer List
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all active:scale-95 h-10 px-5"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit Customer
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white !gap-0 !py-0">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">General Information</h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                    <Input
                      placeholder="Company name"
                      value={formData.company_name}
                      onChange={(e) => {
                        setFormData({ ...formData, company_name: e.target.value });
                        clearError("company_name");
                      }}
                      disabled={!isEditing}
                      className={getInputClassName(errors.company_name, true, !isEditing)}
                    />
                  </div>
                  {errors.company_name && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.company_name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      First Name
                    </label>
                    <Input
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => {
                        setFormData({ ...formData, first_name: e.target.value });
                        clearError("first_name");
                      }}
                      disabled={!isEditing}
                      className={getInputClassName(errors.first_name, false, !isEditing)}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      Last Name
                    </label>
                    <Input
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={(e) => {
                        setFormData({ ...formData, last_name: e.target.value });
                        clearError("last_name");
                      }}
                      disabled={!isEditing}
                      className={getInputClassName(errors.last_name, false, !isEditing)}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          clearError("email");
                        }}
                        disabled={!isEditing}
                        className={getInputClassName(errors.email, true, !isEditing)}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      Phone Number
                    </label>
                    <div
                      className={cn(
                        "relative flex items-center h-12 bg-slate-50/50 border rounded-xl focus-within:ring-2 transition-all",
                        !isEditing && "bg-slate-100/70 cursor-default",
                        errors.phone
                          ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
                          : "border-slate-200 focus-within:ring-[#0064cb]/10 focus-within:border-[#0064cb]"
                      )}
                    >
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => isEditing && setIsDropdownOpen(!isDropdownOpen)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 h-full rounded-l-xl border-r transition-colors focus:outline-none",
                          isEditing ? "hover:bg-slate-100/50 cursor-pointer" : "cursor-default",
                          errors.phone ? "border-red-200" : "border-slate-200/80"
                        )}
                      >
                        <img
                          src={`https://flagcdn.com/w20/${selectedCountry.code}.png`}
                          alt={selectedCountry.name}
                          className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                        />
                        <span className="text-sm font-semibold text-slate-700">{selectedCountry.dialCode}</span>
                        {isEditing && <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </button>

                      <div className="relative flex-1 h-full flex items-center">
                        <Phone className="absolute left-3 w-4 h-4 text-slate-700" />
                        <input
                          type="text"
                          placeholder="Enter phone number"
                          value={formData.phone_digits}
                          disabled={!isEditing}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                            setFormData({ ...formData, phone_digits: digits });
                            clearError("phone");
                          }}
                          className={cn(
                            "w-full h-full bg-transparent outline-none border-none pl-9 pr-3 text-slate-800 font-medium placeholder-slate-400 text-sm",
                            !isEditing && "text-slate-600 cursor-default"
                          )}
                        />
                      </div>

                      {isDropdownOpen && isEditing && (
                        <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in duration-100">
                          {countries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer ${selectedCountry.code === country.code
                                  ? "bg-blue-50/30 font-semibold text-[#0064cb]"
                                  : "text-slate-700"
                                }`}
                            >
                              <img
                                src={`https://flagcdn.com/w20/${country.code}.png`}
                                alt={country.name}
                                className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                              />
                              <span className="flex-1 truncate font-medium">{country.name}</span>
                              <span className="text-slate-700 text-xs font-semibold">{country.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">User Type</h3>

                <div className="bg-[#f0f7ff] border border-[#e0f0ff] rounded-xl p-4">
                  <div className="flex gap-2">
                    <div className="text-[#0064cb] mt-0.5">
                      <Info className="w-4 h-4" />
                    </div>
                    <div className="space-y-2 text-xs text-slate-700">
                      <p className="font-semibold text-[#0064cb]">Note -</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        <li>
                          <strong>User Type – Net Term:</strong> The estimate/invoice is calculated based on the predefined guard pricing configured for the customer.
                        </li>
                        <li>
                          <strong>User Type – Regular:</strong> The estimate/invoice is calculated based on the pricing defined in Guard Bank.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      User Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                      disabled={!isEditing}
                      onValueChange={(val) => {
                        setFormData({ ...formData, billing_type: val });
                        clearError("billing_type");
                      }}
                      value={formData.billing_type}
                    >
                      <SelectTrigger className={getSelectTriggerClassName(errors.billing_type, !isEditing)}>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="net_term">Net Term</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.billing_type && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billing_type}</p>
                    )}
                  </div>

                  {formData.billing_type === "net_term" && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-1">
                        Net Terms (Days)
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </label>
                      <Select
                        disabled={!isEditing}
                        onValueChange={(val) => {
                          setFormData({ ...formData, net_terms_days: val });
                          clearError("net_terms_days");
                        }}
                        value={formData.net_terms_days}
                      >
                        <SelectTrigger className={getSelectTriggerClassName(errors.net_terms_days, !isEditing)}>
                          <SelectValue placeholder="Select Net Terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Net 7</SelectItem>
                          <SelectItem value="10">Net 10</SelectItem>
                          <SelectItem value="15">Net 15</SelectItem>
                          <SelectItem value="30">Net 30</SelectItem>
                          <SelectItem value="45">Net 45</SelectItem>
                          <SelectItem value="60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.net_terms_days && (
                        <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.net_terms_days}</p>
                      )}
                    </div>
                  )}
                </div>

                {formData.billing_type === "net_term" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-1">
                        Security Service Price <span className="text-red-500">*</span>{" "}
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isEditing ? "Set default prices for security services (editable)" : "Configured default prices for security services"}
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase">
                          <tr>
                            <th className="p-2.5 w-10 text-center">#</th>
                            <th className="p-2.5">Service Name</th>
                            <th className="p-2.5 w-38">Price (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {DEFAULT_SERVICES.map((service, index) => {
                            const price = formData.security_service_price[service.name] ?? 0;
                            return (
                              <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-2 text-center text-slate-400 font-medium">{index + 1}</td>
                                <td className="p-2 text-slate-600 font-medium">{service.name}</td>
                                <td className="p-2">
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2.5 text-slate-400 font-medium text-xs">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={price}
                                      disabled={!isEditing}
                                      onKeyDown={(e) => {
                                        if (e.key === "-" || e.key === "+") {
                                          e.preventDefault();
                                        }
                                      }}
                                      onBlur={() => {
                                        if (
                                          (price as any) === "" ||
                                          price === null ||
                                          price === undefined ||
                                          isNaN(Number(price)) ||
                                          Number(price) < 0
                                        ) {
                                          setFormData({
                                            ...formData,
                                            security_service_price: {
                                              ...formData.security_service_price,
                                              [service.name]: 0,
                                            },
                                          });
                                        }
                                      }}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                                          if (val === "" || Number(val) >= 0) {
                                            setFormData({
                                              ...formData,
                                              security_service_price: {
                                                ...formData.security_service_price,
                                                [service.name]: val as any,
                                              },
                                            });
                                          }
                                        }
                                      }}
                                      className="w-full h-8 pl-6 pr-2 bg-white disabled:bg-slate-100 disabled:text-slate-600 border border-slate-200 rounded-md text-slate-700 font-semibold focus:outline-none focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb] text-xs transition-all"
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Billing Address</h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                    Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                    <Input
                      placeholder="Enter street address"
                      value={formData.billing_street}
                      disabled={!isEditing}
                      onChange={(e) => {
                        setFormData({ ...formData, billing_street: e.target.value });
                        clearError("billing_street");
                      }}
                      className={getInputClassName(errors.billing_street, true, !isEditing)}
                    />
                  </div>
                  {errors.billing_street && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billing_street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      Country
                    </label>
                    <Input
                      value={ALLOWED_COUNTRIES[formData.billing_country] || formData.billing_country || "United States"}
                      disabled
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                    {errors.billing_country && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billing_country}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      State
                    </label>
                    {!isEditing ? (
                      <Input
                        value={formData.billing_state}
                        disabled
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    ) : (
                      <Select
                        onValueChange={(val) => {
                          setFormData({ ...formData, billing_state: val });
                          clearError("billing_state");
                        }}
                        value={formData.billing_state}
                      >
                        <SelectTrigger className={getSelectTriggerClassName(errors.billing_state)}>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicStates.map((s) => (
                            <SelectItem key={s.id} value={s.state}>
                              {s.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.billing_state && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billing_state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      City
                    </label>
                    <Input
                      placeholder="Enter city"
                      value={formData.billing_city}
                      disabled={!isEditing}
                      onChange={(e) => {
                        setFormData({ ...formData, billing_city: e.target.value });
                        clearError("billing_city");
                      }}
                      className={getInputClassName(errors.billing_city, false, !isEditing)}
                    />
                    {errors.billing_city && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billing_city}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      ZIP Code
                    </label>
                    <Input
                      placeholder="ZIP Code"
                      maxLength={10}
                      value={formData.billing_zip}
                      disabled={!isEditing}
                      onChange={(e) => {
                        setFormData({ ...formData, billing_zip: e.target.value.slice(0, 10) });
                        clearError("billing_zip");
                      }}
                      className={getInputClassName(errors.billing_zip, false, !isEditing)}
                    />
                    {errors.billing_zip && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.billing_zip}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-700">Service Address</h3>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="same-as-billing"
                        checked={formData.sameAsBilling}
                        onChange={(e) => setFormData({ ...formData, sameAsBilling: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#0064cb] focus:ring-[#0064cb] cursor-pointer"
                      />
                      <label
                        htmlFor="same-as-billing"
                        className="text-xs font-semibold text-slate-600 cursor-pointer select-none"
                      >
                        Same as billing
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                    Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                    <Input
                      placeholder="Enter street address"
                      value={formData.service_street}
                      disabled={!isEditing || formData.sameAsBilling}
                      onChange={(e) => {
                        setFormData({ ...formData, service_street: e.target.value });
                        clearError("service_street");
                      }}
                      className={getInputClassName(errors.service_street, true, !isEditing || formData.sameAsBilling)}
                    />
                  </div>
                  {errors.service_street && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.service_street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      Country
                    </label>
                    <Input
                      value={ALLOWED_COUNTRIES[formData.service_country] || formData.service_country || "United States"}
                      disabled
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                    {errors.service_country && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.service_country}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      State
                    </label>
                    {!isEditing || formData.sameAsBilling ? (
                      <Input
                        value={formData.sameAsBilling ? formData.billing_state : formData.service_state}
                        disabled
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    ) : (
                      <Select
                        onValueChange={(val) => {
                          setFormData({ ...formData, service_state: val });
                          clearError("service_state");
                        }}
                        value={formData.service_state}
                      >
                        <SelectTrigger className={getSelectTriggerClassName(errors.service_state)}>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicStates.map((s) => (
                            <SelectItem key={s.id} value={s.state}>
                              {s.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.service_state && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.service_state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      City
                    </label>
                    <Input
                      placeholder="Enter city"
                      value={formData.sameAsBilling ? formData.billing_city : formData.service_city}
                      disabled={!isEditing || formData.sameAsBilling}
                      onChange={(e) => {
                        setFormData({ ...formData, service_city: e.target.value });
                        clearError("service_city");
                      }}
                      className={getInputClassName(errors.service_city, false, !isEditing || formData.sameAsBilling)}
                    />
                    {errors.service_city && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.service_city}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">
                      ZIP Code
                    </label>
                    <Input
                      placeholder="ZIP Code"
                      maxLength={10}
                      value={formData.sameAsBilling ? formData.billing_zip : formData.service_zip}
                      disabled={!isEditing || formData.sameAsBilling}
                      onChange={(e) => {
                        setFormData({ ...formData, service_zip: e.target.value.slice(0, 10) });
                        clearError("service_zip");
                      }}
                      className={getInputClassName(errors.service_zip, false, !isEditing || formData.sameAsBilling)}
                    />
                    {errors.service_zip && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.service_zip}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CustomerViewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0064cb]" />
        </div>
      }
    >
      <CustomerViewContent />
    </React.Suspense>
  );
}
