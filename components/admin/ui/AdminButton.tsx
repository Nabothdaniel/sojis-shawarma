import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function AdminButton({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}: AdminButtonProps) {
  
  const baseStyles = "rounded-full px-5 py-3 text-xs font-label font-bold uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-on-surface text-surface hover:bg-on-surface/90",
    secondary: "bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80",
    tertiary: "bg-primary-container text-on-primary-container hover:bg-primary-container/90",
    danger: "bg-error/10 text-error hover:bg-error/20",
    ghost: "bg-transparent text-outline hover:bg-surface-container-low hover:text-on-surface"
  };

  return (
    <button 
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
