import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  HomeIcon,
  BellIcon,
  BookOpenIcon,
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlusIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  X,
  Menu
} from "lucide-react";

interface SidebarProps {
  isMobile: boolean;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

export function Sidebar({ isMobile, showMobileMenu, setShowMobileMenu }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location]);

  // Base styles common for all links
  const linkBaseClass = "flex items-center space-x-2 px-2 py-2 rounded-md transition-colors";
  // Active link styles
  const activeLinkClass = "text-[#1976D2] bg-[#1976D2]/10 font-medium";
  // Inactive link styles
  const inactiveLinkClass = "text-[#2C3E50] hover:bg-gray-100";

  const sidebarClass = cn(
    "bg-white w-64 min-h-screen shadow-md z-20 flex flex-col",
    isMobile ? "fixed transition-transform duration-300 ease-in-out" : "sticky top-0"
  );

  const mobileTransformClass = isMobile && !showMobileMenu ? "-translate-x-full" : "translate-x-0";

  const links = [
    {
      path: "/",
      label: "Dashboard",
      icon: <HomeIcon className="h-5 w-5" />,
      roles: ["student", "teacher", "admin"],
    },
    {
      path: "/announcements",
      label: "Announcements",
      icon: <BellIcon className="h-5 w-5" />,
      roles: ["student", "teacher", "admin"],
    },
    {
      path: "/assignments",
      label: "Assignments",
      icon: <BookOpenIcon className="h-5 w-5" />,
      roles: ["student", "teacher", "admin"],
    },
    {
      path: "/materials",
      label: "Study Materials",
      icon: <BookIcon className="h-5 w-5" />,
      roles: ["student", "teacher", "admin"],
    },
    {
      path: "/schedule",
      label: "Schedule",
      icon: <CalendarIcon className="h-5 w-5" />,
      roles: ["student", "teacher", "admin"],
    },
    {
      path: "/create",
      label: "Create Content",
      icon: <PlusIcon className="h-5 w-5" />,
      roles: ["teacher", "admin"],
    },
    {
      path: "/users",
      label: "User Management",
      icon: <UsersIcon className="h-5 w-5" />,
      roles: ["admin"],
    },
  ];

  return (
    <div className={cn(sidebarClass, mobileTransformClass)}>
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold font-['Inter'] text-[#2C3E50]">Dashboard</h2>
        {isMobile && (
          <button
            onClick={closeMobileMenu}
            className="md:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-6 w-6 text-[#2C3E50]" />
          </button>
        )}
      </div>

      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {links
            .filter((link) => user && link.roles.includes(user.role))
            .map((link) => (
              <li key={link.path}>
                <Link href={link.path}>
                  <a
                    className={cn(
                      linkBaseClass,
                      isActive(link.path) ? activeLinkClass : inactiveLinkClass
                    )}
                    onClick={closeMobileMenu}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                </Link>
              </li>
            ))}

          <li className="pt-4 border-t mt-4">
            <button
              onClick={handleLogout}
              className={cn(linkBaseClass, inactiveLinkClass)}
              disabled={logoutMutation.isPending}
            >
              <LogOutIcon className="h-5 w-5" />
              <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-md text-[#2C3E50] hover:bg-gray-100"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
