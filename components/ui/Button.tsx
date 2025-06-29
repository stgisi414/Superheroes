import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'comic-button-secondary text-white';
      case 'danger':
        return 'comic-button-danger text-white';
      default:
        return 'comic-button text-black';
    }
  };

  const baseClasses = `
    font-bold py-3 px-6 font-comic text-lg
    transition-all duration-100 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${getVariantClasses()}
    ${className}
  `;

  return (
    <button
      className={baseClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;