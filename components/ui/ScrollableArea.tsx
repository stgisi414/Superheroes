
import React from 'react';

interface ScrollableAreaProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string; // e.g., '300px', '50vh'
}

const ScrollableArea: React.FC<ScrollableAreaProps> = ({ children, className = '', maxHeight = 'auto' }) => {
  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight: maxHeight }}
    >
      {children}
    </div>
  );
};

export default ScrollableArea;
    