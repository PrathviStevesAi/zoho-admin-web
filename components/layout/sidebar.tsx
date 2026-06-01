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
  Calendar
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Calendar", icon: Calendar, href: "/calendar" },
  { label: "Users Directory", icon: Users, href: "/users-directory" },
  { label: "Profile", icon: User, href: "/profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleToggle = () => setIsCollapsed(prev => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

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
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "group flex items-center h-11 rounded-lg transition-all duration-200",
                  isCollapsed ? "justify-center px-0" : "px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
          })}
        </nav>
      </aside>

      <div className="hidden md:block w-[70px] shrink-0" />
    </>
  );
}
