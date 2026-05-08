"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";

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
  return (
    <header className="flex items-center justify-between h-16 border-b bg-card px-6 sticky top-0 z-50">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/images/website-logo.png"
          alt="logo"
          width={110}
          height={32}
          className="object-contain"
          priority
        />
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-4">
        <NotificationsNav />
        <UserNav />
      </div>
    </header>
  );
}

function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 flex items-center gap-2 pl-1 pr-2 rounded-full hover:bg-muted transition-all active:scale-95"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback className="bg-brand-secondary text-brand-secondary-foreground text-xs font-bold">
              A
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left hidden sm:flex">
            <span className="text-sm font-semibold leading-none">Admin</span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Admin</span>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-2 mt-1 rounded-sm bg-card border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] animate-in fade-in-0 zoom-in-95"
      >
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-foreground">admin</p>
            <p className="text-xs leading-none text-muted-foreground">admin@gmail.com</p>
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

          <DropdownMenuItem className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted group-focus:bg-primary/10">
              <Settings className="size-4" />
            </div>
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-muted/50 mx-1 mt-1" />

        <DropdownMenuItem
          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer mt-1 text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
          onClick={() => signOut()}
        >
          <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/5">
            <LogOut className="size-4" />
          </div>
          <span className="font-bold">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
