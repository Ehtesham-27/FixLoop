import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex justify-center items-center p-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizes[size]}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

