import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { PanelLeftClose } from "lucide-react";

export const SidebarBrand = ({ isCollapsed, toggleCollapse }) => {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/logo.png' : '/logo.png';

  return (
    <div className="bg-main relative flex flex-col transition-all duration-300">
      {/* Top bar containing only the toggle button */}
      <div className={`flex items-center h-12 pt-2 ${isCollapsed ? "justify-center" : "justify-end pr-3"}`}>
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-8 h-8 rounded-md text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <PanelLeftClose className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Logo area */}
      <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed ? "pb-4 pt-2" : "pb-5"}`}>
        <Link to="/">
          {isCollapsed ? (
            /* Icon-only: show a small square version of the logo */
            <img
              src={logoSrc}
              alt="Rihala"
              className="h-9 w-9 object-contain rounded-lg"
            />
          ) : (
            /* Full logo */
            <img
              src={logoSrc}
              alt="Rihala Logo"
              className="h-24 w-auto object-contain scale-110"
            />
          )}
        </Link>
      </div>
    </div>
  );
};
