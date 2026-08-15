import React from 'react';
import { Button } from "../components/ui/Button";
import { X } from "lucide-react";
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const SidebarBrand = ({ setSidebarOpen }) => {
  const { theme } = useTheme();
  // the file name can be changed if we have two variants
  const logoSrc = theme === 'dark' ? '/logo.png' : '/logo.png';

  return (
    <div className="flex items-center justify-center py-5 bg-main relative overflow-hidden">
      <Link to="/" onClick={() => setSidebarOpen(false)}>
        <img src={logoSrc} alt="Rihala Logo" className="h-24 w-auto object-contain scale-110" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden absolute right-4 text-secondary"
        onClick={() => setSidebarOpen(false)}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

