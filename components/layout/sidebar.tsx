"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Users,
  Calendar,
  ChevronDown,
  Megaphone,
  Activity
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Calendar", icon: Calendar, href: "/calendar" },
  {
    label: "Users Directory",
    icon: Users,
    href: "/users-directory",
    submenus: [
      { label: "Members", href: "/users-directory" },
      { label: "Guards", href: "/users-directory/guards" }
    ]
  },
  { label: "Broadcast Notification", icon: Megaphone, href: "/broadcast-notifications" },
  { label: "Service Logs", icon: Activity, href: "/service-logs" },
  { label: "Profile", icon: User, href: "/profile" },
];

export function Sidebar() {
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
    // Auto-open Users Directory submenu if on sub-routes
    if (pathname.startsWith("/users-directory")) {
      setOpenSubmenus(prev => ({ ...prev, "Users Directory": true }));
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
        <div className="flex items-center h-16 px-4 justify-between border-b">
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

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {routes.map((route) => {
            const hasSubmenus = "submenus" in route && Array.isArray(route.submenus);
            const submenus = hasSubmenus ? (route as any).submenus : [];
            const isParentActive = pathname === route.href || submenus.some((sub: any) => pathname === sub.href);

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
                <route.icon className="size-5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 font-medium whitespace-nowrap flex-1">
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
                href={(route as any).href}
                className={cn(
                  "group flex items-center h-11 rounded-lg transition-all duration-200",
                  isCollapsed ? "justify-center px-0" : "px-3",
                  isParentActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-[#333] hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <route.icon className="size-5 shrink-0" />
                {!isCollapsed && (
                  <span className="ml-3 font-medium whitespace-nowrap">
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
                    {submenus.map((sub: any) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "flex items-center h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200",
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
        </nav>
      </aside>

      <div className="hidden md:block w-[70px] shrink-0" />
    </>
  );
}
