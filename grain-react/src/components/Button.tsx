import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';
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
  const baseStyles = 'control-press inline-flex items-center justify-center gap-1.5 font-semibold rounded-[10px] border';
  
  const variants = {
    primary: 'bg-accent text-white border-accent hover:bg-[#d94d82] hover:border-[#d94d82] shadow-[0_2px_0_#bd3d70]',
    secondary: 'bg-[#fffefc] text-gray-800 border-[#e8e2e3] hover:bg-[#faf7f5] hover:border-[#d9d0d3] shadow-[0_2px_0_rgba(48,32,39,.06)]',
    danger: 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 shadow-[0_2px_0_#b91c1c]',
    ghost: 'bg-transparent text-gray-500 border-transparent hover:bg-[#f4efed] hover:text-gray-800',
    gradient: 'bg-[#e85d91] text-white border-[#e85d91] hover:bg-[#d94d82] hover:border-[#d94d82] shadow-[0_2px_0_#bd3d70]',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
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
