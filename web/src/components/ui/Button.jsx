import React from 'react';

const variantStyles = {
  primary: 'border border-transparent bg-brand text-white shadow-sm hover:bg-brand-hover focus:ring-brand',
  secondary: 'border border-border bg-surface text-primary hover:bg-main',
  danger: 'border border-transparent bg-danger text-white shadow-sm hover:bg-danger-hover focus:ring-danger',
  ghost: 'text-muted hover:text-primary bg-transparent',
  ghostPrimary: 'text-brand hover:text-brand-hover bg-transparent',
  ghostDanger: 'text-muted hover:text-danger bg-transparent transition-colors',
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
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
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
