import React from 'react';

const ThemedCard = ({ 
  children, 
  className = '', 
  elevated = false, 
  interactive = false,
  ...props 
}) => {
  const baseClass = `card ${elevated ? 'card-elevated' : ''} ${interactive ? 'interactive' : ''} ${className}`;
  
  return (
    <div className={baseClass} {...props}>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default ThemedCard;
