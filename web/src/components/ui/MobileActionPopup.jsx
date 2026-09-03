import React from "react";

export const MobileActionPopup = ({ actions, onClose }) => {
  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
      />
      <div 
        className="absolute right-0 top-8 z-50 bg-surface border border-border shadow-lg rounded-sm overflow-hidden flex flex-col min-w-[140px] divide-y divide-border/60 [&_button]:w-full [&_button]:justify-start [&_button]:px-4 [&_button]:py-3 [&_button]:h-auto [&_button]:text-sm [&_button]:rounded-none [&_button_svg]:mr-2.5"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        {actions}
      </div>
    </>
  );
};
