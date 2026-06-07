import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-1.5 font-medium transition-all rounded-lg border';
  
  const variants = {
    primary: 'bg-accent text-white border-accent hover:opacity-85',
    secondary: 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-500 text-white border-red-500 hover:opacity-85',
    ghost: 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100',
  };
  
  const sizes = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  };
  
  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
