import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Copy, Check } from "lucide-react";
import { BackButton } from "./BackButton";
import { StatusBadge } from "./StatusBadge";
import { InlineSkeleton } from "./skeletons";
import toast from "react-hot-toast";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
};

const THEMES = {
  amber: {
    topAccent: "bg-gradient-to-r from-amber-500 via-amber-400/60 to-amber-500/10",
    avatarBg: "bg-gradient-to-br from-amber-500 via-amber-600 to-stone-800 text-white shadow-amber-500/15",
    badgeColor: "text-amber-600 dark:text-amber-400",
    tagStyle: "bg-warning/10 text-warning border-warning/25",
    iconColor: "text-amber-500",
  },
  blue: {
    topAccent: "bg-gradient-to-r from-blue-500 via-indigo-500/60 to-blue-500/10",
    avatarBg: "bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-blue-500/15",
    badgeColor: "text-blue-600 dark:text-blue-400",
    tagStyle: "bg-accent/10 text-accent border-accent/25",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  emerald: {
    topAccent: "bg-gradient-to-r from-emerald-500 via-teal-400/60 to-emerald-500/10",
    avatarBg: "bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 text-white shadow-emerald-500/15",
    badgeColor: "text-emerald-600 dark:text-emerald-400",
    tagStyle: "bg-success/10 text-success border-success/25",
    iconColor: "text-emerald-500",
  },
};

export const EntityHeader = ({
  // Navigation & Breadcrumbs
  parentTo,
  parentLabel,
  title,

  // Identity & Theming
  theme = "amber",
  typeLabel,
  typeIcon: TypeIcon,
  status,
  initials,

  // Contact & Meta
  phone,
  email,
  metaItems = [],

  // Action Buttons
  actions,

  // KPI Metrics (Lower section)
  metrics = [],
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const activeTheme = THEMES[theme] || THEMES.amber;

  const handleCopyPhone = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast.success("Phone number copied to clipboard");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const displayInitials = initials || getInitials(title);

  return (
    <div className="space-y-4">
      {/* ── Breadcrumb & Navigation Bar ── */}
      <div className="flex items-center gap-2">
        <BackButton />
        {parentTo && parentLabel && (
          <nav className="flex items-center gap-1.5 text-sm font-medium">
            <Link
              to={parentTo}
              className="text-secondary hover:text-primary transition-colors"
            >
              {parentLabel}
            </Link>
            <span className="text-muted/50 text-xs">/</span>
            <span className="text-primary font-semibold truncate max-w-[240px] sm:max-w-md">
              {title}
            </span>
          </nav>
        )}
      </div>

      {/* ── Executive Compact Profile Card ── */}
      <div className="relative rounded-xl border border-border/70 bg-surface shadow-xs overflow-hidden">
        {/* Subtle Ambient Top Accent Gradient */}
        <div className={`h-0.5 w-full ${activeTheme.topAccent}`} />

        <div className="p-4 sm:p-5">
          {/* Upper Section: Avatar + Name + Tags + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Refined Squircle Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-xl font-extrabold text-lg sm:text-xl tracking-wide shadow-xs ring-1 ring-white/20 dark:ring-white/10 ${activeTheme.avatarBg}`}
                >
                  {displayInitials}
                </div>
                {TypeIcon && (
                  <div
                    className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-surface border border-border/80 shadow-2xs ${activeTheme.badgeColor}`}
                    title={typeLabel || "Verified"}
                  >
                    <TypeIcon className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Name & Quick Meta */}
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-primary font-display tracking-tight truncate">
                    {title}
                  </h1>
                  {typeLabel && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${activeTheme.tagStyle}`}
                    >
                      {TypeIcon && <TypeIcon className="h-2.5 w-2.5" />} {typeLabel}
                    </span>
                  )}
                  {status && (
                    <StatusBadge
                      status={status}
                      showDot
                      className="text-[11px] py-0.5 px-2 shrink-0"
                    />
                  )}
                </div>

                {/* Contact & Meta Row */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-secondary">
                  {/* Phone with copy */}
                  {phone && (
                    <div className="inline-flex items-center gap-1 font-medium">
                      <Phone className={`h-3 w-3 ${activeTheme.iconColor} shrink-0`} />
                      <a
                        href={`tel:${phone}`}
                        className="hover:text-primary transition-colors font-mono"
                        title="Call"
                      >
                        {phone}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="text-muted hover:text-primary transition-colors p-0.5 rounded hover:bg-main inline-flex items-center cursor-pointer"
                        title="Copy phone number"
                        aria-label="Copy phone number"
                      >
                        {copiedPhone ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Email */}
                  {email && (
                    <>
                      {phone && <span className="text-muted/40 hidden sm:inline">•</span>}
                      <div className="inline-flex items-center gap-1 font-medium">
                        <Mail className={`h-3 w-3 ${activeTheme.iconColor} shrink-0`} />
                        <a
                          href={`mailto:${email}`}
                          className="hover:text-primary transition-colors"
                          title="Send email"
                        >
                          {email}
                        </a>
                      </div>
                    </>
                  )}

                  {/* Additional Meta Items */}
                  {metaItems.map((item, idx) => {
                    if (!item || !item.label) return null;
                    const ItemIcon = item.icon;
                    const isFirst = !phone && !email && idx === 0;

                    const content = (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          item.onClick
                            ? "hover:text-primary transition-colors cursor-pointer group"
                            : ""
                        } ${item.className || ""}`}
                        title={item.title}
                        onClick={item.onClick}
                      >
                        {ItemIcon && (
                          <ItemIcon
                            className={`h-3 w-3 text-muted shrink-0 ${
                              item.onClick ? "group-hover:text-primary transition-colors" : ""
                            }`}
                          />
                        )}
                        <span>{item.label}</span>
                      </span>
                    );

                    return (
                      <span key={idx} className="inline-flex items-center gap-x-2.5">
                        {!isFirst && <span className="text-muted/40 hidden sm:inline">•</span>}
                        {content}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            {actions && (
              <div className="shrink-0 flex sm:items-center sm:self-center gap-2">
                {actions}
              </div>
            )}
          </div>

          {/* Lower Section: Integrated KPI Metric Columns */}
          {metrics && metrics.length > 0 && (
            <div
              className={`mt-3.5 pt-3.5 border-t border-border/50 grid grid-cols-2 ${
                metrics.length === 3
                  ? "sm:grid-cols-3"
                  : metrics.length >= 4
                  ? "sm:grid-cols-4"
                  : `sm:grid-cols-${metrics.length}`
              } gap-3 sm:gap-4 lg:gap-6`}
            >
              {metrics.map((metric, idx) => {
                if (!metric) return null;
                const {
                  label,
                  value,
                  subtitle,
                  isLoading,
                  valueClassName,
                  statusDot,
                } = metric;

                const dotColorMap = {
                  danger: "bg-danger text-danger",
                  success: "bg-success text-success",
                  warning: "bg-warning text-warning",
                  accent: "bg-accent text-accent",
                };

                const resolvedDotColor =
                  dotColorMap[statusDot?.color] || dotColorMap.success;

                return (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      {label}
                    </span>
                    <div className="mt-0.5">
                      {isLoading ? (
                        <InlineSkeleton className="h-6 w-24" />
                      ) : (
                        <div
                          className={
                            valueClassName ||
                            "text-base sm:text-lg lg:text-xl font-bold text-primary font-display tracking-tight"
                          }
                        >
                          {value}
                        </div>
                      )}
                    </div>
                    {subtitle && (
                      <span className="text-[11px] text-muted leading-tight">
                        {subtitle}
                      </span>
                    )}
                    {statusDot && (
                      <div className="flex items-center gap-1.5 leading-tight mt-0.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            statusDot.pulse ? "animate-pulse" : ""
                          } ${resolvedDotColor.split(" ")[0]}`}
                        />
                        <span
                          className={`text-[11px] font-semibold ${
                            resolvedDotColor.split(" ")[1]
                          }`}
                        >
                          {statusDot.text}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
