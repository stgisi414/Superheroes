
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className = '', text = 'LOADING...' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6';
      case 'large':
        return 'w-16 h-16';
      default:
        return 'w-10 h-10';
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main spinning element */}
        <div className={`${getSizeClasses()} border-4 border-black border-t-yellow-400 border-r-red-400 border-b-blue-400 border-l-green-400 rounded-full animate-spin`} />
        
        {/* Comic book style "loading" effects */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-bangers text-yellow-400 text-xs animate-pulse">
              ZAP!
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="ml-3 font-comic font-bold text-lg animate-pulse">
        {text.split('').map((char, index) => (
          <span key={index} className={`text-${['red-500', 'yellow-400', 'green-400', 'blue-500', 'purple-500', 'pink-500', 'orange-500'][index % 7]}`}>{char}</span>
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;
