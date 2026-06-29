"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { GooglePlacesAutocomplete } from "@/components/ui/GooglePlacesAutocomplete";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createManualInvoiceAction } from "@/actions/dashboard.actions";

export default function NewWorkOrderPage() {
  const router = useRouter();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceDigits, setInvoiceDigits] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  // Address State
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (fieldKey: string) => {
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
  };

  // Generate random 5-digit invoice number
  const handleGenerateInvoiceNo = () => {
    const randDigits = Math.floor(10000 + Math.random() * 90000).toString();
    setInvoiceDigits(randDigits);
    clearError("invoiceNo");
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = "Customer name is required.";
    }

    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address.";
    }

    if (!invoiceDigits) {
      newErrors.invoiceNo = "Invoice number is required.";
    } else if (invoiceDigits.length !== 5) {
      newErrors.invoiceNo = "Invoice digits must be exactly 5 digits.";
    }

    if (!invoiceAmount) {
      newErrors.invoiceAmount = "Invoice amount is required.";
    } else {
      const amt = parseInt(invoiceAmount, 10);
      if (isNaN(amt) || amt < 0) {
        newErrors.invoiceAmount = "Invoice amount must be a non-negative integer.";
      }
    }

    if (!streetAddress.trim()) {
      newErrors.streetAddress = "Street Address is required.";
    }
    if (!city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!state.trim()) {
      newErrors.state = "State is required.";
    }
    if (!zipCode.trim()) {
      newErrors.zipCode = "ZIP Code is required.";
    }
    if (!country.trim()) {
      newErrors.country = "Country is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all the required fields.", {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
      return;
    }

    setIsSubmitting(true);

    const fullInvoiceNo = `INV-${invoiceDigits}`;
    const fullShippingAddress = `${streetAddress}, ${city}, ${state}, ${zipCode}, ${country}`;

    const payload = {
      customer_name: customerName,
      customer_email: customerEmail,
      invoice_no: fullInvoiceNo,
      invoice_description: invoiceDescription,
      invoice_amount: parseInt(invoiceAmount, 10),
      shipping_address: {
        street: streetAddress,
        city: city,
        state: state,
        zip: zipCode,
        country: country,
        address: fullShippingAddress
      }
    };

    try {
      const res = await createManualInvoiceAction(payload);
      if (res.success) {
        toast.success(`Work Order ${fullInvoiceNo} created successfully!`);
        if (res.invoice_id) {
          router.push(`/invoices/${res.invoice_id}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(res.error || "Failed to create work order.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to the dashboard
    router.push("/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto py-0 px-4 font-sans">
      {/* Back button */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </button>

      {/* Main Form Card */}
      <Card className="border-border shadow-md rounded-lg overflow-hidden bg-card">
        <CardHeader className="border-b border-border pb-6">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create New Work Order
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1 text-sm font-medium">
              Fill in the details below to generate a new work order.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Customer Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    clearError("customerName");
                  }}
                  placeholder="Enter Customer Name"
                  className={errors.customerName ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.customerName && (
                  <p className="text-xs text-red-500 font-semibold">{errors.customerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Customer Email
                </Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    clearError("customerEmail");
                  }}
                  placeholder="Enter Customer Email"
                  className={errors.customerEmail ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.customerEmail && (
                  <p className="text-xs text-red-500 font-semibold">{errors.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Invoice Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Invoice Number Generator */}
              <div className="space-y-2">
                <Label htmlFor="invoice_no" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Invoice Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className={`flex flex-1 rounded-sm border bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all ${errors.invoiceNo ? "border-red-500" : "border-border"}`}>
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-md text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center border-r border-border select-none">
                      INV-
                    </span>
                    <Input
                      id="invoice_no"
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-10 w-full bg-transparent text-slate-900 dark:text-slate-100 font-medium"
                      value={invoiceDigits}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").substring(0, 5);
                        setInvoiceDigits(val);
                        clearError("invoiceNo");
                      }}
                      placeholder="Enter Invoice Number"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateInvoiceNo}
                    className="h-10 cursor-pointer text-xs font-semibold shrink-0"
                  >
                    Generate
                  </Button>
                </div>
                {errors.invoiceNo ? (
                  <p className="text-xs text-red-500 font-semibold">{errors.invoiceNo}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">Type a 5-digit number or generate one randomly</p>
                )}
              </div>

              {/* Invoice Amount */}
              <div className="space-y-2">
                <Label htmlFor="invoice_amount" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Invoice Amount ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoice_amount"
                  value={invoiceAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setInvoiceAmount(val);
                    clearError("invoiceAmount");
                  }}
                  placeholder="Enter Invoice Amount"
                  className={errors.invoiceAmount ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.invoiceAmount ? (
                  <p className="text-xs text-red-500 font-semibold">{errors.invoiceAmount}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">Whole positive integers only (no decimals or negative values)</p>
                )}
              </div>
            </div>

            {/* Description textarea */}
            <div className="space-y-2">
              <Label htmlFor="invoice_description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Service Description
              </Label>
              <textarea
                id="invoice_description"
                rows={4}
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
                placeholder="Enter Service Description"
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-md text-slate-900 dark:text-slate-100 font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[90px] transition-all"
              />
            </div>

            {/* Shipping Address Section */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-md font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Service Address <span className="text-red-500">*</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="street_address" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Street Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                  <GooglePlacesAutocomplete
                    placeholder="Enter Street Address"
                    value={streetAddress}
                    onChange={(val) => {
                      setStreetAddress(val);
                      clearError("streetAddress");
                    }}
                    onAddressSelect={(address) => {
                      setStreetAddress(address.street || "");
                      clearError("streetAddress");
                      if (address.city) {
                        setCity(address.city);
                        clearError("city");
                      }
                      if (address.state) {
                        setState(address.state);
                        clearError("state");
                      }
                      if (address.zip) {
                        setZipCode(address.zip);
                        clearError("zipCode");
                      }
                      if (address.country) {
                        setCountry(address.country);
                        clearError("country");
                      }
                    }}
                    className={`pl-11 bg-slate-50/50 border-slate-200 transition-all text-slate-800 font-medium ${errors.streetAddress ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                {errors.streetAddress && (
                  <p className="text-xs text-red-500 font-semibold">{errors.streetAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      clearError("city");
                    }}
                    placeholder="Enter City"
                    className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 font-semibold">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      clearError("state");
                    }}
                    placeholder="Enter State"
                    className={errors.state ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.state && (
                    <p className="text-xs text-red-500 font-semibold">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      clearError("country");
                    }}
                    placeholder="Enter Country"
                    className={errors.country ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.country && (
                    <p className="text-xs text-red-500 font-semibold">{errors.country}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip_code"
                    maxLength={10}
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value.slice(0, 10));
                      clearError("zipCode");
                    }}
                    placeholder="Enter ZIP Code"
                    className={errors.zipCode ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.zipCode && (
                    <p className="text-xs text-red-500 font-semibold">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleCancel}
                className="px-5 h-11 cursor-pointer font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-7 h-11 bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
