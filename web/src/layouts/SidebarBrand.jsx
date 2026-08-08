import React from 'react';
import { Button } from "../components/ui/Button";
import { X } from "lucide-react";

export const SidebarBrand = ({ setSidebarOpen }) => {
  return (
    <div className="flex items-center justify-center py-5 border-b border-border/80 bg-surface relative overflow-hidden">
      <img src="/logo.png" alt="Rihala Logo" className="h-24 w-auto object-contain scale-110" />
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden absolute right-4 text-secondary hover:bg-accent/10 hover:text-accent"
        onClick={() => setSidebarOpen(false)}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
