import React from 'react';

const ThemedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseClass = `btn btn-${variant} ${size !== 'medium' ? `btn-${size}` : ''} ${className}`;
  
  return (
    <button 
      className={baseClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ThemedButton;
