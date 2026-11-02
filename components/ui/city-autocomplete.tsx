"use client";

import React, { useState, useEffect, useRef } from "react";

export interface CityOption {
  name: string;
  stateCode?: string;
  countryCode?: string;
  [key: string]: any;
}

export interface CityAutocompleteProps {
  name?: string;
  value?: string;
  onChange?: (e: any) => void;
  onSelectOption?: (option: CityOption) => void;
  options: CityOption[];
  disabled?: boolean;
  placeholder?: string;
  error?: any;
  className?: string;
  showStateBadge?: boolean;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  name = "city",
  value = "",
  onChange,
  onSelectOption,
  options = [],
  disabled = false,
  placeholder = "Select or enter city",
  error,
  className = "",
  showStateBadge = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter((opt) =>
    (opt?.name || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const handleSelect = (opt: CityOption) => {
    setSearchTerm(opt.name);
    setIsOpen(false);
    if (onSelectOption) {
      onSelectOption(opt);
    }
    if (onChange) {
      onChange({ target: { name, value: opt.name, type: "text" } });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    setIsOpen(true);
    if (onChange) {
      onChange({ target: { name, value: newVal, type: "text" } });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-30">
      <input
        type="text"
        name={name}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={`flex h-10 w-full rounded-md border ${
          error ? "border-red-500 ring-1 ring-red-500" : "border-slate-300"
        } bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${className}`}
        onChange={handleInputChange}
        onFocus={() => {
          if (!disabled) setIsOpen(true);
        }}
      />
      {isOpen && !disabled && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-xl text-sm py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 150).map((opt, i) => (
              <li
                key={`${opt.name}-${opt.stateCode || ""}-${i}`}
                className="cursor-pointer px-3 py-2 hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
              >
                <span>{opt.name}</span>
                {showStateBadge && opt.stateCode && (
                  <span className="text-xs text-slate-400 font-mono font-medium ml-2">
                    {opt.stateCode}
                  </span>
                )}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-slate-500">No results found</li>
          )}
        </ul>
      )}
    </div>
  );
};
