
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className = '' }) => {
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
        <span className="text-red-500">L</span>
        <span className="text-yellow-400">O</span>
        <span className="text-green-400">A</span>
        <span className="text-blue-500">D</span>
        <span className="text-purple-500">I</span>
        <span className="text-pink-500">N</span>
        <span className="text-orange-500">G</span>
        <span className="text-red-500">.</span>
        <span className="text-yellow-400">.</span>
        <span className="text-green-400">.</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
