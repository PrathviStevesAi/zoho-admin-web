"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { clientFetchCustomerByIdAction, updateCustomerAction } from "@/lib/client-actions";
import { State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "@/app/subcontractor/components/StaticData";
import { getSecurityServiceStatesAction } from "@/actions/quote.actions";
import { toast } from "sonner";
import {
  ArrowLeft, Edit, Save, X, Loader2, Building, User, Mail, Phone, MapPin, CreditCard, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const searchParams = useSearchParams();
  const zohoCustomerId = searchParams.get("customer_id");

  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    billing_street: "",
    billing_city: "",
    billing_state: "",
    billing_zip: "",
    billing_country: "",
    service_street: "",
    service_city: "",
    service_state: "",
    service_zip: "",
    service_country: "",
    billing_type: "",
    net_terms_days: "",
    security_service_price: {} as Record<string, number>,
  });

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
      setFormData({
        company_name: data.company_name || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        billing_street: data.billing_address?.street || "",
        billing_city: data.billing_address?.city || "",
        billing_state: data.billing_address?.state || "",
        billing_zip: data.billing_address?.zip || "",
        billing_country: data.billing_address?.country || "",
        service_street: data.service_address?.street || "",
        service_city: data.service_address?.city || "",
        service_state: data.service_address?.state || "",
        service_zip: data.service_address?.zip || "",
        service_country: data.service_address?.country || "",
        billing_type: data.billing_type || "",
        net_terms_days: data.net_terms_days ? String(data.net_terms_days) : "",
        security_service_price: data.security_service_price || {},
      });
    }
    setIsLoading(false);
  };

  const [dynamicStates, setDynamicStates] = useState<{ id: number, state: string }[]>([]);
  const [billingAddressCities, setBillingAddressCities] = useState<any[]>([]);
  const [serviceAddressCities, setServiceAddressCities] = useState<any[]>([]);

  useEffect(() => {
    getSecurityServiceStatesAction().then(res => {
      if (res.success && res.data) {
        setDynamicStates(res.data);
      }
    });
  }, []);

  const getCitiesForStateName = (stateName: string) => {
    const allUsStates = State.getStatesOfCountry("US");
    const match = allUsStates.find(s => s.name === stateName);
    if (match) {
      return City.getCitiesOfState("US", match.isoCode).map(c => ({ name: c.name }));
    }
    if (US_STATE_CITY_DATA[stateName]) {
      return US_STATE_CITY_DATA[stateName].cities.map(c => ({ name: c }));
    }
    return [];
  };

  useEffect(() => {
    if (formData.billing_state) {
      setBillingAddressCities(getCitiesForStateName(formData.billing_state));
    } else {
      setBillingAddressCities([]);
    }
  }, [formData.billing_state]);

  useEffect(() => {
    if (formData.service_state) {
      setServiceAddressCities(getCitiesForStateName(formData.service_state));
    } else {
      setServiceAddressCities([]);
    }
  }, [formData.service_state]);

  const handleSave = async () => {
    const payload: any = {};
    if (formData.company_name !== customerData.company_name) payload.company_name = formData.company_name;
    if (formData.first_name !== customerData.first_name) payload.first_name = formData.first_name;
    if (formData.last_name !== customerData.last_name) payload.last_name = formData.last_name;
    if (formData.email !== customerData.email) payload.email = formData.email;
    if (formData.phone_number !== customerData.phone_number) payload.phone_number = formData.phone_number;

    const billingChanged =
      formData.billing_street !== (customerData.billing_address?.street || "") ||
      formData.billing_city !== (customerData.billing_address?.city || "") ||
      formData.billing_state !== (customerData.billing_address?.state || "") ||
      formData.billing_zip !== (customerData.billing_address?.zip || "") ||
      formData.billing_country !== (customerData.billing_address?.country || "");

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
      formData.service_country !== (customerData.service_address?.country || "");

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
      payload.security_service_price = Object.keys(formData.security_service_price || {}).length > 0 ? formData.security_service_price : null;
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
      setFormData({
        company_name: customerData.company_name || "",
        first_name: customerData.first_name || "",
        last_name: customerData.last_name || "",
        email: customerData.email || "",
        phone_number: customerData.phone_number || "",
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
        billing_type: customerData.billing_type || "",
        net_terms_days: customerData.net_terms_days ? String(customerData.net_terms_days) : "",
        security_service_price: customerData.security_service_price || {},
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            <div className="space-y-6">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                </div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                  </div>
                </div>
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
        <Button variant="outline" className="mt-4" onClick={() => router.push("/users-directory/customers")}>
          Go Back
        </Button>
      </div>
    );
  }

  const hasChanges = customerData ? (
    formData.company_name !== (customerData.company_name || "") ||
    formData.first_name !== (customerData.first_name || "") ||
    formData.last_name !== (customerData.last_name || "") ||
    formData.email !== (customerData.email || "") ||
    formData.phone_number !== (customerData.phone_number || "") ||
    formData.billing_street !== (customerData.billing_address?.street || "") ||
    formData.billing_city !== (customerData.billing_address?.city || "") ||
    formData.billing_state !== (customerData.billing_address?.state || "") ||
    formData.billing_zip !== (customerData.billing_address?.zip || "") ||
    formData.billing_country !== "US" ||
    formData.service_street !== (customerData.service_address?.street || "") ||
    formData.service_city !== (customerData.service_address?.city || "") ||
    formData.service_state !== (customerData.service_address?.state || "") ||
    formData.service_zip !== (customerData.service_address?.zip || "") ||
    formData.service_country !== "US" ||
    formData.billing_type !== (customerData.billing_type || "") ||
    formData.net_terms_days !== (customerData.net_terms_days ? String(customerData.net_terms_days) : "") ||
    JSON.stringify(formData.security_service_price) !== JSON.stringify(customerData.security_service_price || {})
  ) : false;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/users-directory/customers")}
          className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Details</h1>
          <p className="text-sm text-slate-500 font-medium">{customerData.company_name || `${customerData.first_name} ${customerData.last_name}`}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="text-slate-500 hover:text-slate-700 px-6 py-2.5 h-auto">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges} className="bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-md px-6 py-2.5 h-auto">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 px-6 py-2.5 h-auto">
              <Edit className="w-4 h-4 mr-2" /> Edit Customer
            </Button>
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" /> General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase">Company Name</Label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10 h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">First Name</Label>
                  <Input
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Last Name</Label>
                  <Input
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled
                    className="pl-10 h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10 h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="my-8 border-slate-200" />

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-400" /> Billing Details
            </h2>

            <div className="space-y-4">
              <div className="bg-[#f0f7ff] border border-[#e0f0ff] rounded-xl p-4">
                <div className="flex gap-2">
                  <div className="text-[#0064cb] mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="font-semibold text-[#0064cb]">Note -</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li><strong>Billing Type – Zoho:</strong> The customer can place orders, which are processed through Zoho, similar to the Auto Quote process. The customer will receive the estimate and invoice through Zoho based on the pricing defined in Guard Bank.</li>
                      <li><strong>Billing Type – Net Terms:</strong>The customer is a regular customer who can place orders using the predefined guard pricing configured during customer registration.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Billing Type</Label>
                  {!isEditing ? (
                    <div className="h-12 flex items-center">
                      {formData.billing_type ? (
                        <span className="inline-flex items-center justify-center text-center px-5 py-2 rounded-full border border-[#0064cb]/30 bg-[#e0f0ff] text-[#0064cb] font-bold text-[13px] uppercase tracking-wider min-w-[120px]">
                          {formData.billing_type === "zoho" ? "Zoho" : "Net Term"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center text-center px-6 py-2 rounded-full border border-orange-200 bg-orange-50 text-orange-600 font-bold text-[13px] min-w-[220px]">
                          No Billing Type Selected Yet
                        </span>
                      )}
                    </div>
                  ) : (
                    <Select
                      onValueChange={(val) => setFormData({ ...formData, billing_type: val })}
                      value={formData.billing_type || ""}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                        <SelectValue placeholder="Select billing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoho">Zoho</SelectItem>
                        <SelectItem value="net_term">Net Term</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {formData.billing_type === "net_term" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      Net Terms (Days)
                    </Label>
                    {!isEditing ? (
                      <div className="h-12 bg-slate-100 rounded-xl px-3 flex items-center text-slate-600 text-sm font-medium border border-slate-200">
                        {formData.net_terms_days ? `Net ${formData.net_terms_days}` : "---"}
                      </div>
                    ) : (
                      <Select
                        onValueChange={(val) => setFormData({ ...formData, net_terms_days: val })}
                        value={formData.net_terms_days?.toString() || ""}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
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
                    )}
                  </div>
                )}
              </div>

              {formData.billing_type === "net_term" && (() => {
                const currentServicePrices = Object.keys(formData.security_service_price || {}).length > 0
                  ? formData.security_service_price
                  : {
                    "Armed Security": 0,
                    "Body Guard Armed": 0,
                    "Fire Watch Guard": 0,
                    "Unarmed Security": 0,
                    "Body Guard Unarmed": 0,
                    "Body Guard with Suit": 0,
                    "Employee Termination / Work Place Separation Security": 0,
                  };

                return (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-1">
                        Security Service Price
                      </h4>
                      <p className="text-[11px] text-slate-500">Default prices for security services</p>
                    </div>
                    <div className="border border-slate-200 overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase">
                          <tr>
                            <th className="p-2.5 w-10 text-center">#</th>
                            <th className="p-2.5">Service Name</th>
                            <th className="p-2.5 w-48">Price (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(currentServicePrices).map(([name, price], index) => (
                            <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-2 text-center text-slate-400 font-medium">{index + 1}</td>
                              <td className="p-2 text-slate-600 font-medium">{name}</td>
                              <td className="p-2">
                                <div className="relative flex items-center">
                                  <span className="absolute left-2.5 text-slate-400 font-medium text-xs">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price as number}
                                    disabled={!isEditing}
                                    onKeyDown={(e) => {
                                      if (e.key === '-') {
                                        e.preventDefault();
                                      }
                                    }}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || Number(val) >= 0) {
                                        setFormData({
                                          ...formData,
                                          security_service_price: {
                                            ...currentServicePrices,
                                            [name]: val as any
                                          }
                                        });
                                      }
                                    }}
                                    className="w-full h-8 pl-6 pr-2 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold focus:outline-none focus:border-[#0064cb] focus:ring-1 focus:ring-[#0064cb] text-xs transition-all disabled:bg-slate-100 disabled:text-slate-600"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <hr className="my-8 border-slate-200" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" /> Billing Address
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Street Address</Label>
                  <Input
                    value={formData.billing_street}
                    onChange={e => setFormData({ ...formData, billing_street: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">City</Label>
                    {!isEditing ? (
                      <Input
                        value={formData.billing_city}
                        disabled
                        className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                      />
                    ) : (
                      <Select
                        key={`billing-city-${billingAddressCities.length}`}
                        value={formData.billing_city}
                        onValueChange={val => setFormData({ ...formData, billing_city: val })}
                        disabled={!formData.billing_state}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {billingAddressCities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">State</Label>
                    {!isEditing ? (
                      <Input
                        value={formData.billing_state}
                        disabled
                        className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                      />
                    ) : (
                      <Select
                        value={formData.billing_state}
                        onValueChange={val => setFormData({ ...formData, billing_state: val, billing_city: "" })}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicStates.map((s) => (
                            <SelectItem key={s.id} value={s.state}>{s.state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Zip Code</Label>
                    <Input
                      value={formData.billing_zip}
                      onChange={e => setFormData({ ...formData, billing_zip: e.target.value })}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Country</Label>
                    {!isEditing ? (
                      <Input
                        value={formData.billing_country === "US" ? "United States" : formData.billing_country}
                        disabled
                        className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                      />
                    ) : (
                      <Select
                        value={formData.billing_country}
                        onValueChange={val => setFormData({ ...formData, billing_country: val })}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="United States" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" /> Service Address
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Street Address</Label>
                  <Input
                    value={formData.service_street}
                    onChange={e => setFormData({ ...formData, service_street: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">City</Label>
                    {!isEditing ? (
                      <Input
                        value={formData.service_city}
                        disabled
                        className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                      />
                    ) : (
                      <Select
                        key={`service-city-${serviceAddressCities.length}`}
                        value={formData.service_city}
                        onValueChange={val => setFormData({ ...formData, service_city: val })}
                        disabled={!formData.service_state}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceAddressCities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">State</Label>
                    {!isEditing ? (
                      <Input
                        value={formData.service_state}
                        disabled
                        className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                      />
                    ) : (
                      <Select
                        value={formData.service_state}
                        onValueChange={val => setFormData({ ...formData, service_state: val, service_city: "" })}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicStates.map((s) => (
                            <SelectItem key={s.id} value={s.state}>{s.state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Zip Code</Label>
                    <Input
                      value={formData.service_zip}
                      onChange={e => setFormData({ ...formData, service_zip: e.target.value })}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Country</Label>
                    {!isEditing ? (
                      <Input
                        value={formData.service_country === "US" ? "United States" : formData.service_country}
                        disabled
                        className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                      />
                    ) : (
                      <Select
                        value={formData.service_country}
                        onValueChange={val => setFormData({ ...formData, service_country: val })}
                      >
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="United States" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
