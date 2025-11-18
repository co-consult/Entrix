import React from 'react';

interface CustomCurrencyIconProps {
  className?: string;
  size?: number;
}

export const CustomCurrencyIcon: React.FC<CustomCurrencyIconProps> = ({ 
  className = "h-6 w-6", 
  size 
}) => {
  const iconSize = size || 24;
  
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rectangle */}
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Inner square */}
      <rect
        x="9"
        y="9"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Left plus/asterisk */}
      <g transform="translate(5, 12)">
        <line x1="0" y1="-3" x2="0" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Right plus/asterisk */}
      <g transform="translate(19, 12)">
        <line x1="0" y1="-3" x2="0" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export default CustomCurrencyIcon;
