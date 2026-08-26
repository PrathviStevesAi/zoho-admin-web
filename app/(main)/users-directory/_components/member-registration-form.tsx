"use client";

import { useState } from "react";
import { registerUserAction } from "@/actions/auth.actions";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MemberRegistrationForm({ onBack }: { onBack: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: ""
  });

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (formData.phone) {
      const digitCount = formData.phone.replace(/\D/g, "").length;
      if (digitCount < 7 || digitCount > 15) {
        newErrors.phone = "Phone number must be between 7 and 15 digits";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all the required fields");
      return;
    }

    setErrors({});
    setIsRegistering(true);

    const res = await registerUserAction({
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phone
    });

    if (res.success) {
      toast.success("Member registered successfully");
      setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "" });
      setShowPassword(false);
      onBack();
    } else {
      toast.error(res.error || "Registration failed");
    }
    setIsRegistering(false);
  };

  const getInputClassName = (error?: string, hasLeftIcon?: boolean, hasRightIcon?: boolean) => {
    return cn(
      "h-12 bg-slate-50/50 rounded-xl transition-all text-slate-800 font-medium",
      hasLeftIcon ? "pl-11" : "",
      hasRightIcon ? "pr-11" : "",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb]"
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0064cb]/10 flex items-center justify-center text-[#0064cb]">
            <UserPlus className="w-5 h-5" />
          </div>
          Register New Member
        </h2>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Members List
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white !gap-0 !py-0">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Member Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">First Name</label>
                  <Input
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value.replace(/\d/g, "") });
                      clearError("firstName");
                    }}
                    className={getInputClassName(errors.firstName)}
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Last Name</label>
                  <Input
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value.replace(/\d/g, "") });
                      clearError("lastName");
                    }}
                    className={getInputClassName(errors.lastName)}
                  />
                  {errors.lastName && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Email Address</label>
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
                      className={getInputClassName(errors.email, true)}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex justify-between items-center">
                    <span>Phone Number</span>
                    <span className="text-[10px] lowercase text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        const hasPlus = val.startsWith("+");
                        const digits = val.replace(/\D/g, "").slice(0, 15);
                        setFormData({ ...formData, phone: (hasPlus ? "+" : "") + digits });
                        clearError("phone");
                      }}
                      className={getInputClassName(errors.phone, true)}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-1 w-full sm:w-1/2 sm:pr-2">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider ml-1">Access Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value.replace(/\s/g, "") });
                      clearError("password");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.preventDefault();
                    }}
                    className={getInputClassName(errors.password, true, true)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1">{errors.password}</p>}
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
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering...</span>
                  </div>
                ) : "Register Member"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
