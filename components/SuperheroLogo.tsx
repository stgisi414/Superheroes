
import React from 'react';

interface SuperheroLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

const SuperheroLogo: React.FC<SuperheroLogoProps> = ({ 
  size = 'medium', 
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20', 
    large: 'w-32 h-32'
  };

  return (
    <div 
      className={`superhero-logo ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <img 
        src="/logo.png" 
        alt="Comic RPG Adventure Logo" 
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};

export default SuperheroLogo;
