"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const win = window as any;
  if (win.google?.maps?.places) return Promise.resolve();

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      scriptLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

const DEFAULT_API_KEY = "AIzaSyAcL7f3q3X4BUlmdpjbo7ZY0GotX7Gh-sU";

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onAddressSelect,
  className,
  placeholder = "Enter street address",
  disabled,
}: GooglePlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || DEFAULT_API_KEY;

  // Load Google Maps SDK dynamically on component mount
  useEffect(() => {
    loadGoogleMapsScript(apiKey)
      .then(() => {
        const win = window as any;
        if (!autocompleteServiceRef.current && win.google?.maps?.places) {
          autocompleteServiceRef.current = new win.google.maps.places.AutocompleteService();
        }
        if (!sessionTokenRef.current && win.google?.maps?.places) {
          sessionTokenRef.current = new win.google.maps.places.AutocompleteSessionToken();
        }
      })
      .catch((err) => console.error("Failed to load Google Maps SDK:", err));
  }, [apiKey]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clear predictions/dropdown when value is cleared externally
  useEffect(() => {
    if (!value) {
      setPredictions([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  }, [value]);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!inputValue.trim()) {
      setPredictions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    debounceTimeoutRef.current = setTimeout(() => {
      const win = window as any;
      if (!autocompleteServiceRef.current && win.google?.maps?.places) {
        autocompleteServiceRef.current = new win.google.maps.places.AutocompleteService();
      }

      if (!autocompleteServiceRef.current) {
        setIsSearching(false);
        return;
      }

      if (!sessionTokenRef.current && win.google?.maps?.places) {
        sessionTokenRef.current = new win.google.maps.places.AutocompleteSessionToken();
      }

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: inputValue,
          sessionToken: sessionTokenRef.current || undefined,
        },
        (results: any, status: any) => {
          setIsSearching(false);
          const win = window as any;
          if (status === win.google?.maps?.places?.PlacesServiceStatus?.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300);
  };

  const handleSelectPrediction = (prediction: any) => {
    const streetLabel = prediction.structured_formatting?.main_text || prediction.description;
    onChange(streetLabel);
    setPredictions([]);
    setShowDropdown(false);

    const win = window as any;
    if (!placesServiceRef.current && win.google?.maps?.places) {
      const dummyEl = document.createElement("div");
      placesServiceRef.current = new win.google.maps.places.PlacesService(dummyEl);
    }

    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (place: any, status: any) => {
        if (win.google?.maps?.places) {
          sessionTokenRef.current = new win.google.maps.places.AutocompleteSessionToken();
        }

        if (status === win.google?.maps?.places?.PlacesServiceStatus?.OK && place) {
          const addressComponents = place.address_components;

          let streetNumber = "";
          let route = "";
          let city = "";
          let state = "";
          let zip = "";
          let country = "";

          if (addressComponents) {
            for (const component of addressComponents) {
              const types = component.types;
              if (types.includes("street_number")) {
                streetNumber = component.long_name;
              } else if (types.includes("route")) {
                route = component.long_name;
              } else if (types.includes("locality")) {
                city = component.long_name;
              } else if (types.includes("administrative_area_level_1")) {
                state = component.long_name;
              } else if (types.includes("postal_code")) {
                zip = component.long_name;
              } else if (types.includes("country")) {
                country = component.long_name;
              } else if (!city && types.includes("sublocality_level_1")) {
                city = component.long_name;
              } else if (!city && types.includes("neighborhood")) {
                city = component.long_name;
              }
            }
          }

          let finalStreet = "";
          const formattedAddress = place.formatted_address || "";
          if (formattedAddress) {
            let cityPartIndex = -1;
            if (city) {
              cityPartIndex = formattedAddress.indexOf(`, ${city}`);
              if (cityPartIndex === -1) {
                cityPartIndex = formattedAddress.indexOf(city);
              }
            }
            
            if (cityPartIndex > 0) {
              finalStreet = formattedAddress.slice(0, cityPartIndex).trim();
            } else {
              let nextPartIndex = -1;
              if (state) {
                nextPartIndex = formattedAddress.indexOf(`, ${state}`);
              }
              if (nextPartIndex === -1 && country) {
                nextPartIndex = formattedAddress.indexOf(`, ${country}`);
              }
              
              if (nextPartIndex > 0) {
                finalStreet = formattedAddress.slice(0, nextPartIndex).trim();
              } else {
                finalStreet = formattedAddress;
              }
            }
          }
          
          if (!finalStreet || finalStreet.trim() === "") {
            finalStreet = streetNumber ? `${streetNumber} ${route}` : (route || streetLabel);
          }

          onAddressSelect({
            street: finalStreet,
            city: city || "",
            state: state || "",
            zip: zip || "",
            country: country || ""
          });
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="relative w-full">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (value && predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-xl py-1 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer"
            >
              <span className="font-semibold text-slate-900">
                {prediction.structured_formatting?.main_text || prediction.description}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {prediction.structured_formatting?.secondary_text || prediction.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
