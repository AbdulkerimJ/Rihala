import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Button } from "./ui/Button";
import { SearchInput } from "./ui/SearchInput";
import { LogOut } from "lucide-react";

export const Header = ({ currentUser, onMobileMenuToggle, sectionTitle }) => {
  // Helper to extract user initials for avatar
  const getInitials = (name) => {
    if (!name) return "RM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const { logout } = useAuth();
  const navigate = useNavigate();
  const userRole = currentUser?.roles?.[0]?.name || "No Role";
  const userName = currentUser?.name || "No User";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between bg-main px-4 sm:px-6">
      {/* Left section: Page title on mobile, spacer on desktop */}
      <div className="flex items-center gap-3">
        {/* Section title — visible on mobile, hidden on desktop (sidebar shows nav) */}
        {sectionTitle && (
          <span className="lg:hidden text-sm font-bold text-primary tracking-tight truncate max-w-[120px]">
            {sectionTitle}
          </span>
        )}
      </div>

      {/* Middle section: Reusable Search Input Component */}
      <div className="flex flex-1 max-w-xs lg:max-w-md mx-4 sm:mx-6">
        <SearchInput placeholder="Search..." />
      </div>

      {/* Right section: Theme toggle & User Profile Card */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <div className="p-0.5 rounded-lg hover:bg-main border border-transparent hover:border-border/60 transition-all">
          <ThemeToggle />
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-border/70 mx-0.5 sm:mx-1"></div>

        {/* User Profile Area */}
        <div className="group flex items-center gap-2.5 rounded-xl p-1 sm:px-2 sm:py-1 hover:bg-main/70 transition-all cursor-pointer border border-transparent hover:border-border/50">
          <div className="relative">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-blue-600 text-white font-semibold text-xs shadow-sm border border-surface ring-1 ring-accent/30 transition-transform group-hover:scale-105">
              {getInitials(userName)}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface"></span>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-primary tracking-tight leading-tight group-hover:text-accent transition-colors truncate max-w-[120px]">
              {userName}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center rounded-md bg-accent/10 dark:bg-accent/20 px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider text-accent dark:text-accent-hover">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghostDanger"
          size="icon"
          onClick={handleLogout}
          className="rounded-lg p-2 transition-all ml-1"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
