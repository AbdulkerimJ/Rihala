import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, ChevronDown } from "lucide-react";

export const NavGroup = ({ group, isSidebarOpen, setSidebarOpen, pathname, can, isCollapsed }) => {
  // Check if any item in this group is accessible
  const accessibleItems = group.items.filter(item => !item.permission || can(item.permission));
  
  // If no items are accessible, hide the entire group
  if (accessibleItems.length === 0) return null;

  // Check if any child is currently active
  const isActiveGroup = accessibleItems.some(item => pathname.startsWith(item.path));
  
  // Local state for expanded/collapsed, defaults to true if active or defaultExpanded
  const [isExpanded, setIsExpanded] = useState(isActiveGroup || group.defaultExpanded);

  // Auto-expand if a child becomes active
  useEffect(() => {
    if (isActiveGroup) setIsExpanded(true);
  }, [isActiveGroup]);

  // ─── COLLAPSED SIDEBAR MODE ────────────────────────────────────────────────
  // When the desktop sidebar is collapsed to icon-only mode, render each group
  // as a set of icon-only buttons with native title tooltips.
  if (isCollapsed) {
    return (
      <div className="mb-1 flex flex-col items-center gap-0.5">
        {accessibleItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-primary/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? "text-accent" : ""
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </NavLink>
          );
        })}
        {/* Thin separator between groups */}
        {!group.isFlat && (
          <div className="w-6 h-px bg-border/40 my-1" />
        )}
      </div>
    );
  }

  // ─── FLAT GROUP (e.g. Dashboard / Analytics) ───────────────────────────────
  if (!group.title || group.isFlat) {
    return (
      <div className="mb-2">
        {accessibleItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-primary/90 hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${pathname.startsWith(item.path) ? "text-accent" : "text-primary/50 group-hover:text-primary"}`} />
            {item.name}
          </NavLink>
        ))}
      </div>
    );
  }

  // ─── HIERARCHICAL GROUP ────────────────────────────────────────────────────
  return (
    <div className="mb-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group flex w-full items-center justify-between rounded-md px-3 py-1 text-sm font-medium transition-colors ${
          isActiveGroup
            ? "text-primary bg-brand/5 font-semibold"
            : "text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary"
        }`}
      >
        <div className="flex items-center">
          {group.icon && <group.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActiveGroup ? "text-accent" : "text-secondary group-hover:text-primary"}`} />}
          <span>{group.title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className={`h-4 w-4 transition-colors ${isActiveGroup ? "text-accent opacity-100" : "opacity-70 group-hover:text-primary"}`} />
        ) : (
          <ChevronRight className={`h-4 w-4 transition-colors ${isActiveGroup ? "text-accent opacity-100" : "opacity-40 group-hover:text-primary"}`} />
        )}
      </button>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pl-6 relative before:absolute before:left-[19px] before:top-1 before:bottom-2 before:w-[1px] before:bg-border/60">
          {accessibleItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center rounded-sm px-3 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-accent bg-accent/10 font-semibold relative before:absolute before:left-[-12.5px] before:top-1/2 before:-translate-y-1/2 before:w-[5px] before:h-[5px] before:rounded-full before:bg-accent"
                    : "text-primary/90 hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={`mr-2.5 h-4 w-4 flex-shrink-0 transition-colors ${pathname.startsWith(item.path) ? "text-accent" : "text-primary/50 group-hover:text-primary/80"}`} />
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};
