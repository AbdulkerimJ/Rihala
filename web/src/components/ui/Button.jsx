import React from 'react';

const variantStyles = {
  primary: 'bg-accent text-white shadow-sm hover:bg-accent-hover focus:ring-accent',
  secondary: 'border border-border bg-surface text-primary shadow-sm hover:bg-main hover:border-muted focus:ring-accent',
  danger: 'bg-danger text-white shadow-sm hover:bg-danger-hover focus:ring-danger',
  ghost: 'text-muted hover:text-primary bg-transparent hover:bg-black/5 dark:hover:bg-white/5',
  ghostPrimary: 'text-primary hover:text-accent bg-transparent hover:bg-black/5 dark:hover:bg-white/5',
  ghostDanger: 'text-muted hover:text-danger bg-transparent hover:bg-black/5 dark:hover:bg-white/5',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-1', // Minimal padding for icons
  none: '', // No padding for completely custom
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';
  
  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${fullWidth ? 'w-full flex' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClassName}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
