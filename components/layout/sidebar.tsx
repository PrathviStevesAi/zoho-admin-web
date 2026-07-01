"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Calendar,
  ChevronDown,
  Megaphone,
  Activity,
  Shield,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  icon: React.ElementType;
  href?: string;
  submenus?: { label: string; href: string }[];
};

type NavGroup = {
  groupLabel: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    groupLabel: "Security Management",
    items: [
      { label: "Operation Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "New Work Order", icon: ClipboardList, href: "/new-work-order" },
      { label: "Schedule Calendar", icon: Calendar, href: "/calendar" },
      { label: "Broadcast Notification", icon: Megaphone, href: "/broadcast-notifications" },
    ],
  },
  {
    groupLabel: "Guard Management",
    items: [
      { label: "Guard Bank", icon: Shield, href: "/guard-bank" },
    ],
  },
  {
    groupLabel: "User Management",
    items: [
      {
        label: "Users",
        icon: Users,
        submenus: [
          { label: "Guard", href: "/users-directory/guards" },
          { label: "Member", href: "/users-directory" },
        ],
      },
    ],
  },
  {
    groupLabel: "System",
    items: [
      { label: "Service Logs", icon: Activity, href: "/service-logs" },
    ],
  },
];

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);

    const handleToggle = () => setIsCollapsed(prev => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    // Auto-open Users submenu if on sub-routes
    if (pathname.startsWith("/users-directory")) {
      setOpenSubmenus(prev => ({ ...prev, "Users": true }));
    }
  }, [pathname]);

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-[40] transition-opacity"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 h-screen bg-card border-r transition-all duration-300 ease-in-out z-[60] flex flex-col shadow-2xl",
          isCollapsed ? "-left-[70px] md:left-0 w-[70px]" : "left-0 w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-4 justify-between border-b shrink-0">
          {!isCollapsed && (
            <div className="relative w-24 h-8">
              <Image src="/images/website-logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("hover:bg-muted shrink-0", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </Button>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 px-3 py-4 overflow-y-auto", isCollapsed ? "space-y-1" : "space-y-4")}>
          {navGroups.map((group) => (
            <div key={group.groupLabel}>
              {/* Section label — hidden when collapsed */}
              {!isCollapsed && (
                <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
                  {group.groupLabel}
                </p>
              )}



              <div className="space-y-1">
                {group.items.map((route) => {
                  const hasSubmenus = Array.isArray(route.submenus) && route.submenus.length > 0;
                  let submenus = hasSubmenus ? route.submenus! : [];

                  // Hide "Member" submenu if user is a "member"
                  if (userRole === "member" && route.label === "Users") {
                    submenus = submenus.filter((sub) => sub.label !== "Member");
                  }

                  const isParentActive =
                    (route.href && pathname === route.href) ||
                    submenus.some((sub) => pathname === sub.href);

                  const Icon = route.icon;

                  const mainItem = hasSubmenus ? (
                    <button
                      onClick={() => {
                        if (isCollapsed) {
                          setIsCollapsed(false);
                          setOpenSubmenus(prev => ({ ...prev, [route.label]: true }));
                        } else {
                          setOpenSubmenus(prev => ({ ...prev, [route.label]: !prev[route.label] }));
                        }
                      }}
                      className={cn(
                        "w-full group flex items-center h-11 rounded-lg transition-all duration-200 text-left cursor-pointer",
                        isCollapsed ? "justify-center px-0" : "px-3",
                        isParentActive && !openSubmenus[route.label]
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-[#333] hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="ml-3 text-[14px] font-semibold whitespace-nowrap flex-1">
                            {route.label}
                          </span>
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-200 text-[#333] group-hover:text-accent-foreground",
                              openSubmenus[route.label] ? "rotate-180" : ""
                            )}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={route.href!}
                      className={cn(
                        "group flex items-center h-11 rounded-lg transition-all duration-200",
                        isCollapsed ? "justify-center px-0" : "px-3",
                        isParentActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-[#333] hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3 text-[14px] font-semibold whitespace-nowrap">
                          {route.label}
                        </span>
                      )}
                    </Link>
                  );

                  return (
                    <div key={route.label} className="space-y-1">
                      {isCollapsed ? (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            {mainItem}
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={16} className="font-montserrat">
                            {route.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        mainItem
                      )}

                      {!isCollapsed && hasSubmenus && openSubmenus[route.label] && (
                        <div className="pl-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                          {submenus.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className={cn(
                                  "flex items-center h-9 px-3 rounded-lg text-xs font-medium transition-all duration-200",
                                  isSubActive
                                    ? "bg-[#0064cb]/10 text-[#0064cb] font-bold"
                                    : "text-[#333] hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="hidden md:block w-[70px] shrink-0" />
    </>
  );
}
