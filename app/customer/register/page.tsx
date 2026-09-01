import React from "react";
import { PublicCustomerRegistrationForm } from "./_components/public-customer-form";

export default function PublicCustomerRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PublicCustomerRegistrationForm />
      </div>
    </div>
  );
}
