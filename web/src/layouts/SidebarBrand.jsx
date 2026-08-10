import React from 'react';
import { Button } from "../components/ui/Button";
import { X } from "lucide-react";
import { Link } from 'react-router-dom';

export const SidebarBrand = ({ setSidebarOpen }) => {
  return (
    <div className="flex items-center justify-center py-5 bg-surface relative overflow-hidden">
      <Link to="/" onClick={() => setSidebarOpen(false)}>
        <img src="/logo.png" alt="Rihala Logo" className="h-24 w-auto object-contain scale-110" />
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
