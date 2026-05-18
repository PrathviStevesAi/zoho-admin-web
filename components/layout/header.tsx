"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, User, Settings, LogOut, ChevronDown, Search, XCircle } from "lucide-react";
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

export function Header() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounceValue(searchValue, 300);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<any>(null);

  const { data: session } = useSession();

  const loadProfile = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/profile`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${session.accessToken}`,
        }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoice/global-search?search=${debouncedSearch}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
          }
        });
        const data = await response.json();
        if (data.success) {
          setResults(data.data);
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupedResults = results.reduce((acc, item) => {
    const type = item.type === "invoice" ? "Invoices" : "Shifts";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleExpand = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <header className="flex items-center justify-between h-16 border-b bg-white px-6 sticky top-0 z-50">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3 shrink-0 w-[240px]">
        <Link href="/dashboard">
          <Image
            src="/images/website-logo.png"
            alt="logo"
            width={110}
            height={32}
            className="object-contain"
            style={{ width: 'auto' }}
            priority
          />
        </Link>
      </div>

      {/* CENTER: Global Search Bar */}
      <div className="flex-1 flex justify-center px-4 max-w-2xl relative" ref={searchRef}>
        <div className="relative group w-full max-w-[580px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-[#0064cb] animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0064cb] transition-colors" />
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
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search INV, Shift,..."
            className={cn(
              "w-full h-10 pl-11 bg-slate-50/80 border border-slate-300 rounded-lg text-[13px] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#0064cb]/5 focus:border-[#0064cb] focus:shadow-sm transition-all duration-300",
              searchValue ? "pr-10" : "pr-4"
            )}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {searchValue && (
              <XCircle
                className="h-4 w-4 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                onClick={() => {
                  setSearchValue("");
                  setResults([]);
                  setIsOpen(false);
                  setExpandedTypes([]);
                }}
              />
            )}
          </div>

          {/* Search Results Dropdown */}
          {isOpen && (results.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-[60] max-h-[480px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {isLoading && results.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#0064cb]" />
                  Searching...
                </div>
              ) : (
                <div className="py-2">
                  {(Object.entries(groupedResults) as [string, any[]][]).map(([type, items]) => {
                    const isExpanded = expandedTypes.includes(type);
                    const displayItems = isExpanded ? items : items.slice(0, 3);
                    const hasMore = items.length > 3;

                    return (
                      <div key={type} className="mb-2 last:mb-0">
                        <div className="px-4 py-2 flex items-center justify-between">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{type}</h3>
                          {hasMore && (
                            <button
                              onClick={(e) => toggleExpand(type, e)}
                              className="text-[11px] font-semibold text-[#0064cb] hover:underline bg-transparent border-none cursor-pointer"
                            >
                              {isExpanded ? "Show less" : "View more..."}
                            </button>
                          )}
                        </div>
                        <div className="divide-y divide-slate-50">
                          {displayItems.map((item) => (
                            <Link
                              key={item.invoice_id || item.shift_id}
                              href={item.type === 'invoice' ? `/invoices/${item.invoice_id}` : `/notifications/view?shift_id=${item.shift_id}`}
                              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors group/item"
                              onClick={() => {
                                setIsOpen(false);
                                setExpandedTypes([]);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-medium text-slate-600 group-hover/item:text-[#0064cb] transition-colors truncate">
                                    {item.customer_name} - <span className="font-semibold">[{item.invoice_no}]</span>
                                  </span>
                                </div>
                                {item.type === 'shift' && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Shift #{item.shift_no}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 w-[240px] justify-end">
        <NotificationsNav />
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
          className="relative h-10 flex items-center gap-2 pl-1 pr-2 rounded-full hover:bg-muted transition-all active:scale-95"
        >
          <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
            <AvatarImage src={profileImage} alt={name} className="object-cover" />
            <AvatarFallback className="bg-slate-100 text-[#0064cb] text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left hidden sm:flex">
            <span className="text-sm font-semibold leading-none">{name}</span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 capitalize">{role}</span>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
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

          {/* <DropdownMenuItem className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted group-focus:bg-primary/10">
              <Settings className="size-4" />
            </div>
            <span className="font-medium">Settings</span>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-muted/50 mx-1 mt-1" />

        <DropdownMenuItem
          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer mt-1 text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors"
          onClick={() => signOut({ callbackUrl: "/admin-login" })}
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
