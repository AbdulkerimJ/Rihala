import React from "react";

/**
 * A highly reusable mobile list item component designed to replace cards
 * and present information in a clean, flat list format on mobile devices.
 */
export const MobileListItem = ({
  title,
  subtitle,
  avatar, // Can be a string (initials) or a ReactNode
  rightTop,
  rightBottom,
  bottomContent,
  className = "",
}) => {
  return (
    <div className={`p-4 flex flex-col gap-3 ${className}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          {avatar && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-accent/60 text-white font-bold text-lg shadow-sm shrink-0">
              {avatar}
            </div>
          )}
          <div className="flex flex-col min-w-0">
             <span className="font-bold text-primary leading-tight text-base truncate">{title}</span>
             {subtitle && <span className="text-sm text-secondary mt-0.5 truncate">{subtitle}</span>}
          </div>
        </div>
        {(rightTop || rightBottom) && (
          <div className="flex flex-col items-end shrink-0 gap-1">
            {rightTop && <div>{rightTop}</div>}
            {rightBottom && <div>{rightBottom}</div>}
          </div>
        )}
      </div>
      {bottomContent && (
        <div className="mt-2 pt-3 border-t border-border/50 flex items-center justify-between">
          {bottomContent}
        </div>
      )}
    </div>
  );
};
