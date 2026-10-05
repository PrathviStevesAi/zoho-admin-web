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
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { lookupPostalCode, ALLOWED_COUNTRY_CODES } from "@/lib/postal-lookup";

export function PersonalInfoSection({ formData, setFormData, countries, selectedCountry, setIsDropdownOpen, isDropdownOpen }: any) {
  const [isEmailVerifying, setIsEmailVerifying] = useState(false);
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [stateOptions, setStateOptions] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipLocationMessage, setZipLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    const allCountries = Country.getAllCountries().filter(c => ALLOWED_COUNTRY_CODES.includes(c.isoCode));
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
    if (formData.addressCountry && formData.addressState) {
      let stateCode = formData.addressState;
      if (formData.addressState.length > 2) {
        const found = stateOptions.find(
          (s) => s.name.toLowerCase() === formData.addressState.toLowerCase() || s.isoCode === formData.addressState
        );
        if (found) stateCode = found.isoCode;
      }
      setCityOptions(City.getCitiesOfState(formData.addressCountry, stateCode) || []);
    } else if (formData.addressCountry === "US") {
      setCityOptions(City.getCitiesOfCountry("US") || []);
    } else {
      setCityOptions([]);
    }
  }, [formData.addressState, formData.addressCountry, stateOptions]);

  const handleZipLookup = async (zipValue: string) => {
    const rawPostal = (zipValue || "").trim();
    if (rawPostal.length < 3) {
      setZipLocationMessage(null);
      return;
    }
    setIsZipLoading(true);
    try {
      const res = await lookupPostalCode(rawPostal, formData.addressCountry || "US");
      if (res) {
        setFormData((prev: any) => ({
          ...prev,
          ...(res.country && { addressCountry: res.country, countryError: "" }),
          ...(res.stateCode && { addressState: res.stateCode, stateError: "" }),
          ...(res.cityName && { city: res.cityName }),
        }));
        if (res.formattedMessage) {
          setZipLocationMessage(res.formattedMessage);
        }
      } else {
        setZipLocationMessage(null);
      }
    } catch (err) {
      console.error("Postal lookup error:", err);
    } finally {
      setIsZipLoading(false);
    }
  };

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
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col relative z-20 overflow-visible">
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
            onValueChange={(val) => {
              setFormData({ ...formData, addressCountry: val, addressState: "", city: "", countryError: "" });
              setZipLocationMessage(null);
            }}
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
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">ZIP Code</label>
          <div className="relative">
            <Input
              placeholder="Enter ZIP code"
              value={formData.zipCode}
              maxLength={15}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, "");
                setFormData({ ...formData, zipCode: cleaned });
                if (cleaned.length >= 4) {
                  handleZipLookup(cleaned);
                }
              }}
              onBlur={() => {
                if (formData.zipCode) handleZipLookup(formData.zipCode);
              }}
              className="h-11 bg-slate-50/50 pr-8"
            />
            {isZipLoading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          {zipLocationMessage && (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 inline-block" />
              {zipLocationMessage}
            </p>
          )}
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
          <CityAutocomplete
            name="city"
            value={formData.city || ""}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            onSelectOption={(opt) => setFormData({ ...formData, city: opt.name })}
            options={cityOptions}
            disabled={!formData.addressState && !formData.addressCountry}
            placeholder="Select or enter city"
            className="h-11 bg-slate-50/50"
            showStateBadge={!formData.addressState}
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
