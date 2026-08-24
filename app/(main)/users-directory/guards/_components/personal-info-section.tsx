import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { verifySubcontractorApplicationAction } from "@/actions/subcontractor.actions";
import { Country, State, City } from "country-state-city";
import { US_STATE_CITY_DATA } from "@/app/subcontractor/components/StaticData";

const ALLOWED_COUNTRIES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brazil",
  CL: "Chile",
  CO: "Colombia",
  EC: "Ecuador",
  GY: "Guyana",
  PY: "Paraguay",
  PE: "Peru",
  SR: "Suriname",
  UY: "Uruguay",
  VE: "Venezuela",
};

export function PersonalInfoSection({ formData, setFormData, countries, selectedCountry, setIsDropdownOpen, isDropdownOpen }: any) {
  const [isEmailVerifying, setIsEmailVerifying] = useState(false);
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [stateOptions, setStateOptions] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);

  useEffect(() => {
    const allCountries = Country.getAllCountries().filter(c => Object.keys(ALLOWED_COUNTRIES).includes(c.isoCode));
    setCountryOptions(allCountries);
  }, []);

  useEffect(() => {
    if (formData.addressCountry === "US") {
      const usStates = Object.entries(US_STATE_CITY_DATA).map(([name, data]: any) => ({
        isoCode: data.short_code,
        name: name,
      }));
      setStateOptions(usStates);
    } else if (formData.addressCountry) {
      setStateOptions(State.getStatesOfCountry(formData.addressCountry));
    } else {
      setStateOptions([]);
    }
  }, [formData.addressCountry]);

  useEffect(() => {
    if (formData.addressCountry === "US" && formData.addressState) {
      const stateData = Object.values(US_STATE_CITY_DATA).find((s: any) => s.short_code === formData.addressState) as any;
      if (stateData) {
        const usCities = stateData.cities.map((city: string) => ({ name: city }));
        setCityOptions(usCities);
      } else {
        setCityOptions([]);
      }
    } else if (formData.addressCountry && formData.addressState) {
      setCityOptions(City.getCitiesOfState(formData.addressCountry, formData.addressState));
    } else {
      setCityOptions([]);
    }
  }, [formData.addressState, formData.addressCountry]);

  useEffect(() => {
    if (!formData.email) {
      setIsEmailVerified(false);
      setFormData((prev: any) => ({ ...prev, emailError: "" }));
      return;
    }
    const timeoutId = setTimeout(async () => {
      const trimmedEmail = formData.email.trim();
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
        setIsEmailVerifying(true);
        const res = await verifySubcontractorApplicationAction(trimmedEmail, "");
        if (!res.success) {
          setFormData((prev: any) => ({ ...prev, emailError: res.error || "Email already exists" }));
          setIsEmailVerified(false);
        } else {
          setFormData((prev: any) => ({ ...prev, emailError: "" }));
          setIsEmailVerified(true);
        }
        setIsEmailVerifying(false);
      } else {
        setFormData((prev: any) => ({ ...prev, emailError: "Invalid email format" }));
        setIsEmailVerified(false);
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  useEffect(() => {
    if (!formData.phone || formData.phone.length < 10) {
      setIsPhoneVerified(false);
      setFormData((prev: any) => ({ ...prev, phoneError: "" }));
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsPhoneVerifying(true);
      const res = await verifySubcontractorApplicationAction("", `${selectedCountry.dialCode} ${formData.phone}`);
      if (!res.success) {
        setFormData((prev: any) => ({ ...prev, phoneError: res.error || "Phone already exists" }));
        setIsPhoneVerified(false);
      } else {
        setFormData((prev: any) => ({ ...prev, phoneError: "" }));
        setIsPhoneVerified(true);
      }
      setIsPhoneVerifying(false);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.phone, selectedCountry.dialCode]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Personal & Contact Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
          <div className="relative">
            <Input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value, emailError: "" })}
              className={`h-11 bg-slate-50/50 ${formData.emailError ? "border-red-500 focus-visible:ring-red-500" : ""} ${isEmailVerifying || isEmailVerified ? "pr-10" : ""}`}
            />
            {isEmailVerifying && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            {!isEmailVerifying && isEmailVerified && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
          {formData.emailError && <p className="text-xs text-red-500 font-medium mt-1">{formData.emailError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
          <div className={`relative flex items-center h-11 bg-slate-50/50 border ${formData.phoneError ? "border-red-500 ring-1 ring-red-500" : "border-slate-200 focus-within:ring-2 focus-within:ring-[#0064cb]/10 focus-within:border-[#0064cb]"} rounded-md transition-all`}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 h-full rounded-l-md hover:bg-slate-100/50 border-r border-slate-200/80 transition-colors focus:outline-none cursor-pointer"
            >
              <img
                src={`https://flagcdn.com/w20/${selectedCountry.code}.png`}
                alt={selectedCountry.name}
                className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
              />
              <span className="text-sm font-semibold text-slate-700">{selectedCountry.dialCode}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <div className="relative flex-1 h-full flex items-center">
              <input
                type="text"
                placeholder="Enter phone number"
                value={formData.phone}
                maxLength={15}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, ""), phoneError: "" })}
                className={`w-full h-full bg-transparent outline-none border-none pl-3 ${isPhoneVerifying || isPhoneVerified ? "pr-10" : "pr-3"} text-slate-800 font-medium placeholder-slate-400 text-sm`}
              />
              {isPhoneVerifying && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
              {!isPhoneVerifying && isPhoneVerified && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
            {isDropdownOpen && (
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} />
            )}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                {countries.map((country: any) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, selectedCountry: country });
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <img src={`https://flagcdn.com/w20/${country.code}.png`} alt={country.name} className="w-5 h-3.5 object-cover rounded-sm" />
                    <span className="text-sm font-medium text-slate-700 flex-1">{country.name}</span>
                    <span className="text-xs font-bold text-slate-500">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {formData.phoneError && <p className="text-xs text-red-500 font-medium mt-1">{formData.phoneError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">First Name <span className="text-red-500">*</span></label>
          <Input
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value, firstNameError: "" })}
            className={`h-11 bg-slate-50/50 ${formData.firstNameError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {formData.firstNameError && <p className="text-xs text-red-500 font-medium mt-1">{formData.firstNameError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Last Name <span className="text-red-500">*</span></label>
          <Input
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value, lastNameError: "" })}
            className={`h-11 bg-slate-50/50 ${formData.lastNameError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {formData.lastNameError && <p className="text-xs text-red-500 font-medium mt-1">{formData.lastNameError}</p>}
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Street Address</label>
          <Input
            placeholder="Enter street address"
            value={formData.streetAddress}
            onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
            className="h-11 bg-slate-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Country <span className="text-red-500">*</span></label>
          <Select
            value={formData.addressCountry}
            onValueChange={(val) => setFormData({ ...formData, addressCountry: val, addressState: "", city: "", countryError: "" })}
          >
            <SelectTrigger className={`h-11 bg-slate-50/50 ${formData.countryError ? "border-red-500 ring-1 ring-red-500" : ""}`}><SelectValue placeholder="Select Country" /></SelectTrigger>
            <SelectContent>
              {countryOptions.map((c) => (
                <SelectItem key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.countryError && <p className="text-xs text-red-500 font-medium mt-1">{formData.countryError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">State <span className="text-red-500">*</span></label>
          <Select
            value={formData.addressState}
            onValueChange={(val) => setFormData({ ...formData, addressState: val, city: "", stateError: "" })}
            disabled={!formData.addressCountry}
          >
            <SelectTrigger className={`h-11 bg-slate-50/50 ${formData.stateError ? "border-red-500 ring-1 ring-red-500" : ""}`}><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>
              {stateOptions.map((s) => (
                <SelectItem key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.stateError && <p className="text-xs text-red-500 font-medium mt-1">{formData.stateError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">City</label>
          <Select
            value={formData.city}
            onValueChange={(val) => setFormData({ ...formData, city: val })}
            disabled={!formData.addressState}
          >
            <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder="Select City" /></SelectTrigger>
            <SelectContent>
              {cityOptions.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">ZIP Code</label>
          <Input
            placeholder="Enter ZIP code"
            value={formData.zipCode}
            maxLength={10}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/[^a-zA-Z0-9]/g, "") })}
            className="h-11 bg-slate-50/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Driving License No.</label>
          <Input
            placeholder="Enter license number"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.replace(/[^a-zA-Z0-9]/g, "") })}
            className="h-11 bg-slate-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Expiration Date</label>
          <Input
            type="date"
            value={formData.licenseExpirationDate}
            onChange={(e) => setFormData({ ...formData, licenseExpirationDate: e.target.value })}
            className="h-11 bg-slate-50/50"
          />
        </div>
      </div>
    </div>
  );
}
