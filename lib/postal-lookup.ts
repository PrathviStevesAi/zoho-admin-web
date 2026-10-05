import { State } from "country-state-city";

export const ALLOWED_COUNTRY_CODES = [
  "US", "CA", "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"
];

export const ALLOWED_COUNTRIES_MAP: Record<string, string> = {
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

export interface PostalLookupResult {
  country?: string;
  stateCode?: string;
  stateName?: string;
  cityName?: string;
  formattedMessage?: string;
}

export const normalizeLookupText = (str?: string) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * Universal postal code lookup supporting US, CA, and Latin American countries.
 * First checks fast Zippopotam for US 5-digit zip codes.
 * Then queries Google Maps Geocoding API if configured.
 */
export async function lookupPostalCode(
  postalValue: string,
  preferredCountry: string = "US"
): Promise<PostalLookupResult | null> {
  const rawPostal = (postalValue || "").trim();
  if (rawPostal.length < 3) {
    return null;
  }

  let targetCountry = preferredCountry || "US";
  // Canadian postal code format check (e.g. K1A 0B1 or K1A0B1)
  if (/^[A-Za-z]\d[A-Za-z]/.test(rawPostal)) {
    targetCountry = "CA";
  }

  // 1. Quick free Zippopotam lookup for US 5-digit zip
  if (targetCountry === "US" && /^\d{5}$/.test(rawPostal)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${rawPostal}`);
      if (res.ok) {
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          const cityName = place["place name"];
          const stateCode = place["state abbreviation"] || place["state"];
          return {
            country: "US",
            stateCode,
            stateName: place["state"],
            cityName,
            formattedMessage: `Verified: ${cityName}, ${stateCode}`,
          };
        }
      }
    } catch (e) {
      console.error("Zippopotam lookup error:", e);
    }
  }

  // 2. Google Maps Geocoding API for all supported countries
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          rawPostal
        )}&components=country:${targetCountry}&key=${apiKey}`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        const result = gData.results?.[0];
        if (result) {
          const comps = result.address_components || [];
          const cityComp = comps.find(
            (c: any) =>
              c.types?.includes("locality") ||
              c.types?.includes("sublocality") ||
              c.types?.includes("postal_town") ||
              c.types?.includes("administrative_area_level_2")
          );
          const stateComp = comps.find((c: any) =>
            c.types?.includes("administrative_area_level_1")
          );
          const countryComp = comps.find((c: any) => c.types?.includes("country"));

          const cityName = cityComp?.long_name;
          const stateShort = stateComp?.short_name || "";
          const stateLong = stateComp?.long_name || "";
          const resCountry = countryComp?.short_name || targetCountry;

          const countryStates = State.getStatesOfCountry(resCountry) || [];
          const normShort = normalizeLookupText(stateShort);
          const normLong = normalizeLookupText(stateLong);

          const matchedState = countryStates.find((s) => {
            const sIso = normalizeLookupText(s.isoCode);
            const sName = normalizeLookupText(s.name);
            return (
              sIso === normShort ||
              sIso === normLong ||
              sName === normLong ||
              sName === normShort ||
              (normLong.length > 3 && sName.includes(normLong)) ||
              (normLong.length > 3 && normLong.includes(sName)) ||
              (normShort.length > 3 && sName.includes(normShort))
            );
          });

          const finalStateCode = matchedState?.isoCode || stateShort;
          const finalStateName = matchedState?.name || stateLong || stateShort;

          return {
            country: resCountry,
            stateCode: finalStateCode,
            stateName: finalStateName,
            cityName,
            formattedMessage:
              cityName && (finalStateCode || finalStateName)
                ? `Verified: ${cityName}, ${finalStateCode || finalStateName}`
                : cityName
                ? `Verified: ${cityName}`
                : undefined,
          };
        }
      }
    } catch (e) {
      console.error("Google Geocoding error:", e);
    }
  }

  return null;
}
