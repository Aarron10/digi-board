import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { MobileMenuButton } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export function Header({ toggleMobileMenu }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const avatarInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <div className="flex items-center">
          <MobileMenuButton onClick={toggleMobileMenu} />
          <Link href="/">
            <a className="flex items-center">
              <span className="text-xl font-bold text-[#1976D2] ml-2 md:ml-0 font-['Inter']">
                DigiBoard
              </span>
            </a>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                    user?.role === "admin"
                      ? "bg-[#1976D2]"
                      : user?.role === "teacher"
                      ? "bg-[#FF5722]"
                      : "bg-[#4CAF50]"
                  )}
                >
                  {avatarInitials}
                </div>
                <div className="ml-2 hidden md:block">
                  <p className="text-sm font-medium text-[#2C3E50]">{user?.name}</p>
                  <p className="text-xs text-[#2C3E50]/60 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="ml-2 h-5 w-5 text-[#2C3E50]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium text-[#2C3E50] md:hidden">
                {user?.name}
                <p className="text-xs text-[#2C3E50]/60 capitalize">{user?.role}</p>
              </div>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
