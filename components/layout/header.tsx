"use client";

import Image from "next/image";
import Link from "next/link";
import { User, LogOut, ChevronDown, Search, XCircle, Menu, ArrowLeft } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import useDebounceValue from "@/hooks/use-debounce";
import { Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import { NotificationsNav } from "./notifications-nav";
import { fetchProfileAction } from "@/actions/profile.actions";
import { globalSearchAction } from "@/actions/dashboard.actions";

interface SearchResultItem {
  type: "invoice" | "shift";
  customer_name: string;
  invoice_no: string;
  invoice_id?: string;
  shift_no?: string | number;
  shift_id?: string;
}

export function Header() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounceValue(searchValue, 300);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const loadProfile = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetchProfileAction();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (error) {
      console.error("Failed to load header profile:", error);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    window.addEventListener("profile-updated", loadProfile);
    return () => window.removeEventListener("profile-updated", loadProfile);
  }, [loadProfile]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch || debouncedSearch.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await globalSearchAction(debouncedSearch);
        if (res.success && res.data) {
          setResults(res.data);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch, session?.accessToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = !searchRef.current || !searchRef.current.contains(event.target as Node);
      const isOutsideMobile = !mobileSearchRef.current || !mobileSearchRef.current.contains(event.target as Node);
      if (isOutsideDesktop && isOutsideMobile) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupedResults = results.reduce((acc, item) => {
    const type = item.type === "invoice" ? "Invoice" : "Shift";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, SearchResultItem[]>);

  const invoicesList = groupedResults["Invoice"] || [];
  const shiftsList = groupedResults["Shift"] || [];

  const toggleExpand = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const renderSearchResultsDropdown = () => {
    if (!isOpen || (searchValue.trim().length < 2 && !isLoading)) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-[60] max-h-[480px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {isLoading && results.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-sm">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#0064cb]" />
            Searching...
          </div>
        ) : (
          <div className="py-2 divide-y divide-slate-100">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Invoice</h3>
                {invoicesList.length > 3 && (
                  <button
                    onClick={(e) => toggleExpand("Invoice", e)}
                    className="text-[11px] font-semibold text-[#0064cb] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    {expandedTypes.includes("Invoice") ? "Show less" : "View more..."}
                  </button>
                )}
              </div>
              {invoicesList.length > 0 ? (
                <div className="divide-y divide-slate-55">
                  {(expandedTypes.includes("Invoice") ? invoicesList : invoicesList.slice(0, 3)).map((item) => (
                    <Link
                      key={item.invoice_id}
                      href={`/invoices/${item.invoice_id}`}
                      className="flex items-center gap-4 py-2.5 hover:bg-slate-50 transition-colors group/item rounded-md px-2 -mx-2"
                      onClick={() => {
                        setIsOpen(false);
                        setExpandedTypes([]);
                        setIsMobileSearchOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-4 w-full text-[13px]">
                        <span className="font-semibold text-slate-900 min-w-[90px] shrink-0">
                          {item.invoice_no}
                        </span>
                        <span className="text-slate-600 truncate">
                          {item.customer_name}[{item.invoice_no}]
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-slate-700 py-1 font-medium">
                  No Invoice found of this number
                </div>
              )}
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Shift</h3>
                {shiftsList.length > 3 && (
                  <button
                    onClick={(e) => toggleExpand("Shift", e)}
                    className="text-[11px] font-semibold text-[#0064cb] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    {expandedTypes.includes("Shift") ? "Show less" : "View more..."}
                  </button>
                )}
              </div>
              {shiftsList.length > 0 ? (
                <div className="divide-y divide-slate-55">
                  {(expandedTypes.includes("Shift") ? shiftsList : shiftsList.slice(0, 3)).map((item) => (
                    <Link
                      key={item.shift_id}
                      href={`/notifications/view?shift_id=${item.shift_id}`}
                      className="flex items-center gap-4 py-2.5 hover:bg-slate-50 transition-colors group/item rounded-md px-2 -mx-2"
                      onClick={() => {
                        setIsOpen(false);
                        setExpandedTypes([]);
                        setIsMobileSearchOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-4 w-full text-[13px]">
                        <span className="font-semibold text-slate-900 min-w-[90px] shrink-0">
                          {item.shift_no}
                        </span>
                        <span className="text-slate-600 truncate">
                          {item.customer_name}[{item.invoice_no}]
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-slate-700 py-1 font-medium">
                  No Shift found of this number
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="flex items-center justify-between h-16 border-b bg-white px-2 sm:px-4 md:px-6 sticky top-0 z-50">
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-white z-50 flex items-center px-2 gap-2 md:hidden animate-in slide-in-from-top duration-250">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsMobileSearchOpen(false);
              setSearchValue("");
              setResults([]);
              setIsOpen(false);
            }}
            className="text-slate-700 hover:bg-muted cursor-pointer shrink-0 rounded-full h-10 w-10 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative flex-1" ref={mobileSearchRef}>
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 text-[#0064cb] animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-slate-700" />
                )}
              </div>
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (e.target.value.length >= 2) setIsOpen(true);
                }}
                onFocus={() => {
                  if (searchValue.trim().length >= 2) setIsOpen(true);
                }}
                placeholder="Search INV, Shift,..."
                className={cn(
                  "w-full h-10 pl-11 bg-slate-50/80 border border-slate-300 rounded-lg text-[13px] placeholder:text-slate-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#0064cb]/5 focus:border-[#0064cb] focus:shadow-sm transition-all duration-300",
                  searchValue ? "pr-10" : "pr-4"
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {searchValue && (
                  <XCircle
                    className="h-4 w-4 text-slate-700 hover:text-red-500 cursor-pointer transition-colors"
                    onClick={() => {
                      setSearchValue("");
                      setResults([]);
                      setIsOpen(false);
                      setExpandedTypes([]);
                      mobileSearchInputRef.current?.focus();
                    }}
                  />
                )}
              </div>
            </div>
            {renderSearchResultsDropdown()}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 w-auto md:w-[240px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
          className="md:hidden p-1 mr-0 hover:bg-muted cursor-pointer shrink-0"
        >
          <Menu className="size-5 sm:size-6 text-slate-700" />
        </Button>
        <Link href="/dashboard" className="flex items-center shrink-0">
          <Image
            src="/images/website-logo.png"
            alt="logo"
            width={110}
            height={32}
            className="object-contain h-6 w-auto sm:h-8"
            priority
          />
        </Link>
      </div>

      <div className="hidden md:flex flex-1 justify-center px-4 max-w-2xl relative" ref={searchRef}>
        <div className="relative group w-full max-w-[580px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-[#0064cb] animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-slate-700 group-focus-within:text-[#0064cb] transition-colors" />
            )}
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (e.target.value.length >= 2) setIsOpen(true);
            }}
            onFocus={() => {
              if (searchValue.trim().length >= 2) setIsOpen(true);
            }}
            placeholder="Search INV, Shift,..."
            className={cn(
              "w-full h-10 pl-11 bg-slate-50/80 border border-slate-300 rounded-lg text-[13px] placeholder:text-slate-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#0064cb]/5 focus:border-[#0064cb] focus:shadow-sm transition-all duration-300",
              searchValue ? "pr-10" : "pr-4"
            )}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {searchValue && (
              <XCircle
                className="h-4 w-4 text-slate-700 hover:text-red-500 cursor-pointer transition-colors"
                onClick={() => {
                  setSearchValue("");
                  setResults([]);
                  setIsOpen(false);
                  setExpandedTypes([]);
                }}
              />
            )}
          </div>

          {renderSearchResultsDropdown()}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0 w-auto md:w-auto md:min-w-[240px] justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsMobileSearchOpen(true);
            setTimeout(() => {
              mobileSearchInputRef.current?.focus();
            }, 50);
          }}
          className="md:hidden text-[#474d56] hover:text-[#0064cb] transition-colors h-8 w-8 sm:h-10 sm:w-10 rounded-full cursor-pointer flex items-center justify-center shrink-0"
        >
          <Search className="size-[20px] sm:size-[22px] stroke-[1.5px]" />
        </Button>
        <NotificationsNav priority="normal" />
        <NotificationsNav priority="critical" />
        <UserNav session={session} dynamicProfile={profile} />
      </div>
    </header>
  );
}

function UserNav({ session, dynamicProfile }: { session: any, dynamicProfile: any }) {
  const user = dynamicProfile || session?.user;
  const name = dynamicProfile ? `${dynamicProfile.first_name} ${dynamicProfile.last_name}` : (session?.user?.name || "Admin");
  const role = dynamicProfile?.role || session?.user?.role || "Admin";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const profileImage = dynamicProfile?.profile_img_url || session?.user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Button
          variant="ghost"
          className="relative h-8 sm:h-10 flex items-center gap-1 sm:gap-2 pl-0 sm:pl-1 pr-1 sm:pr-2 rounded-full hover:bg-muted transition-all active:scale-95"
        >
          <Avatar className="h-7 w-7 sm:h-9 sm:w-9 border border-slate-200 shadow-sm">
            <AvatarImage src={profileImage} alt={name} className="object-cover" />
            <AvatarFallback className="bg-slate-100 text-[#0064cb] text-[10px] sm:text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left hidden sm:flex">
            <span className="text-sm font-semibold leading-none">{name}</span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 capitalize">{role}</span>
          </div>
          <ChevronDown className="size-3 sm:size-3.5 text-muted-foreground ml-0.5 sm:ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-2 mt-1 rounded-sm bg-card border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] animate-in fade-in-0 zoom-in-95"
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
              <AvatarImage src={profileImage} alt={name} />
              <AvatarFallback className="bg-slate-100 text-[#0064cb] text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 min-w-0">
              <p className="text-sm font-bold leading-none text-foreground truncate">{name}</p>
              <p className="text-xs leading-none text-muted-foreground truncate" title={dynamicProfile?.email || session?.user?.email}>
                {dynamicProfile?.email || session?.user?.email || "admin@gmail.com"}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-muted/50 mx-1" />

        <DropdownMenuGroup className="gap-1 flex flex-col pt-1">
          <Link href="/profile" className="block outline-none">
            <DropdownMenuItem className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
              <div className="flex items-center justify-center size-8 rounded-lg bg-muted group-focus:bg-primary/10">
                <User className="size-4" />
              </div>
              <span className="font-medium">My Profile</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-muted/50 mx-1 mt-1" />

        <DropdownMenuItem
          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer mt-1 text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors"
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/admin-login";
          }}
        >
          <div className="flex items-center justify-center size-8 rounded-lg bg-red-50">
            <LogOut className="size-4 text-red-600" />
          </div>
          <span className="font-bold">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
