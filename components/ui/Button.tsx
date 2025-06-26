
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  smFullWidth?: boolean; // Added new prop for responsive full width
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  smFullWidth, // Destructure the new prop
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

  const variantStyles = {
    primary: 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 text-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-700 focus:ring-slate-500 text-slate-300 hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  let dynamicWidthStyles = '';
  if (fullWidth) {
    dynamicWidthStyles = 'w-full'; 
    if (smFullWidth === false) { 
      dynamicWidthStyles += ' sm:w-auto'; 
    }
  } else { 
    if (smFullWidth === true) {
      dynamicWidthStyles = 'sm:w-full'; 
    }
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${dynamicWidthStyles} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
