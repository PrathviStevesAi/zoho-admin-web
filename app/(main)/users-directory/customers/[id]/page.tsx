"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientFetchCustomerByIdAction, updateCustomerAction } from "@/lib/client-actions";
import { toast } from "sonner";
import { 
  ArrowLeft, Edit, Save, X, Loader2, Building, User, Mail, Phone, MapPin 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

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
  });

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    setIsLoading(true);
    const res = await clientFetchCustomerByIdAction(customerId);
    if (res.success && res.data) {
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
      });
    } else {
      toast.error(res.error || "Failed to load customer details");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    // Dirty checking
    const payload: any = {};
    if (formData.company_name !== customerData.company_name) payload.company_name = formData.company_name;
    if (formData.first_name !== customerData.first_name) payload.first_name = formData.first_name;
    if (formData.last_name !== customerData.last_name) payload.last_name = formData.last_name;
    if (formData.email !== customerData.email) payload.email = formData.email;
    if (formData.phone_number !== customerData.phone_number) payload.phone_number = formData.phone_number;

    // Check billing address changes
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
        country: formData.billing_country,
      };
    }

    // Check service address changes
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
        country: formData.service_country,
      };
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes made.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const res = await updateCustomerAction(customerId, payload);
    setIsSaving(false);

    if (res.success) {
      toast.success("Customer updated successfully");
      setIsEditing(false);
      loadCustomer(); // reload fresh data
    } else {
      toast.error(res.error || "Failed to update customer");
    }
  };

  const handleCancel = () => {
    // Reset to original data
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
        billing_country: customerData.billing_address?.country || "",
        service_street: customerData.service_address?.street || "",
        service_city: customerData.service_address?.city || "",
        service_state: customerData.service_address?.state || "",
        service_zip: customerData.service_address?.zip || "",
        service_country: customerData.service_address?.country || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            {/* General Info Skeleton */}
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

            {/* Addresses Skeleton */}
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

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/users-directory/customers")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Details</h1>
          <p className="text-sm text-slate-500 font-medium">{customerData.company_name || `${customerData.first_name} ${customerData.last_name}`}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        
        {/* Edit Toggle */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-md">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5">
              <Edit className="w-4 h-4 mr-2" /> Edit Customer
            </Button>
          )}
        </div>

        <div className="p-6 md:p-8">
          {/* General Information Section */}
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
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
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
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Last Name</Label>
                  <Input 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
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
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
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
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    disabled={!isEditing}
                    className="pl-10 h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="my-8 border-slate-200" />

          {/* Addresses Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Billing Address */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" /> Billing Address
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Street Address</Label>
                  <Input 
                    value={formData.billing_street} 
                    onChange={e => setFormData({...formData, billing_street: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">City</Label>
                    <Input 
                      value={formData.billing_city} 
                      onChange={e => setFormData({...formData, billing_city: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">State</Label>
                    <Input 
                      value={formData.billing_state} 
                      onChange={e => setFormData({...formData, billing_state: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Zip Code</Label>
                    <Input 
                      value={formData.billing_zip} 
                      onChange={e => setFormData({...formData, billing_zip: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Country</Label>
                    <Input 
                      value={formData.billing_country} 
                      onChange={e => setFormData({...formData, billing_country: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Service Address */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" /> Service Address
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Street Address</Label>
                  <Input 
                    value={formData.service_street} 
                    onChange={e => setFormData({...formData, service_street: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">City</Label>
                    <Input 
                      value={formData.service_city} 
                      onChange={e => setFormData({...formData, service_city: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">State</Label>
                    <Input 
                      value={formData.service_state} 
                      onChange={e => setFormData({...formData, service_state: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Zip Code</Label>
                    <Input 
                      value={formData.service_zip} 
                      onChange={e => setFormData({...formData, service_zip: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Country</Label>
                    <Input 
                      value={formData.service_country} 
                      onChange={e => setFormData({...formData, service_country: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100 border-slate-200"
                    />
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
