import { Country, State, City } from "country-state-city";

export function getCoordinatesFromLocation(locationText: string): [number, number] | null {
  if (!locationText) return null;
  const parts = locationText.split(",").map(p => p.trim());

  for (const rawPart of parts) {
    const part = rawPart.split("-")[0].trim();
    if (part) {
      const foundCity = City.getAllCities().find(
        c => c.name.toLowerCase() === part.toLowerCase()
      );
      if (foundCity && foundCity.latitude && foundCity.longitude) {
        return [parseFloat(foundCity.latitude), parseFloat(foundCity.longitude)];
      }
    }
  }

  for (const rawPart of parts) {
    const part = rawPart.split("-")[0].trim();
    if (part) {
      const foundState = State.getAllStates().find(
        s => s.name.toLowerCase() === part.toLowerCase() || s.isoCode.toLowerCase() === part.toLowerCase()
      );
      if (foundState && foundState.latitude && foundState.longitude) {
        return [parseFloat(foundState.latitude), parseFloat(foundState.longitude)];
      }

      const foundCountry = Country.getAllCountries().find(
        c => c.name.toLowerCase() === part.toLowerCase() || c.isoCode.toLowerCase() === part.toLowerCase()
      );
      if (foundCountry && foundCountry.latitude && foundCountry.longitude) {
        return [parseFloat(foundCountry.latitude), parseFloat(foundCountry.longitude)];
      }
    }
  }
  return null;
}

export const MATRIX_AVATAR_COLORS: { [key: string]: string } = {
  "HC": "bg-indigo-100 text-indigo-700",
  "JT": "bg-purple-100 text-purple-700",
  "RW": "bg-blue-100 text-blue-700",
  "SB": "bg-rose-100 text-rose-700",
  "MC": "bg-sky-100 text-sky-700",
  "DG": "bg-violet-100 text-violet-700",
  "SL": "bg-indigo-100 text-indigo-700",
  "RJ": "bg-blue-100 text-blue-700",
};

export function getMatrixInitials(name: string): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatShiftDisplayDate(dateStr?: string): string {
  if (!dateStr) return "Oct 10, 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatShiftDisplayTime(startStr?: string, endStr?: string): string {
  if (!startStr && !endStr) return "08:00 AM - 04:00 PM";
  try {
    const fmt = (s?: string) => {
      if (!s) return "";
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };
    if (startStr && endStr) {
      return `${fmt(startStr)} - ${fmt(endStr)}`;
    }
    return fmt(startStr || endStr);
  } catch {
    return "08:00 AM - 04:00 PM";
  }
}

export function cleanShiftNo(no: any): string {
  return String(no || "").replace(/^#/, "").trim();
}

export function getCityState(guard: any): string {
  if (guard.city && guard.state) return `${guard.city}, ${guard.state}`;
  if (guard.city) return guard.city;
  if (guard.state) return guard.state;
  if (guard.address) return guard.address;
  return "-";
}

export function getDistance(guard: any): string {
  if (guard?.distance_miles !== undefined && guard?.distance_miles !== null && guard?.distance_miles !== "") {
    const val = guard.distance_miles;
    if (typeof val === "number") {
      return `${val.toFixed(1)} mi`;
    }
    return typeof val === "string" && val.endsWith("mi") ? val : `${val} mi`;
  }
  return "-";
}
