
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
  hideText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48, color = "#1e1b4b", hideText = false }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Тонкое внешнее кольцо */}
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="2" />
      
      {/* Текст по дуге сверху */}
      {!hideText && (
        <>
          <defs>
            <path id="archPath" d="M 25,55 A 25,25 0 0 1 75,55" />
          </defs>
          <text fill={color} fontSize="6.5" fontWeight="900" style={{ letterSpacing: '0.02em', fontFamily: 'serif' }}>
            <textPath href="#archPath" startOffset="50%" textAnchor="middle">
              ЧАЙХАНА ЖУЛЕБИНО
            </textPath>
          </text>
        </>
      )}

      {/* Силуэт чайника из изображения */}
      <path 
        d="M50 50C44.5 50 39.5 52.5 37.5 56.5C36 59.5 36 63.5 37.5 66.5C39.5 70.5 44.5 73 50 73C55.5 73 60.5 70.5 62.5 66.5C64 63.5 64 59.5 62.5 56.5C60.5 52.5 55.5 50 50 50Z" 
        fill={color} 
      />
      {/* Носик */}
      <path 
        d="M37.5 61.5L30 57C29 56.5 28 57 28 58V60C28 62 30 65 32 66.5L37.5 70" 
        fill={color} 
      />
      {/* Ручка */}
      <path 
        d="M62.5 58C67 56 72 57.5 73 63C74 68.5 70 73 65 74C63 74.5 61.5 73 61.5 73" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      {/* Крышка */}
      <path d="M46 50H54C54 48 53 47 50 47C47 47 46 48 46 50Z" fill={color} />
      <circle cx="50" cy="45.5" r="3" fill={color} />
    </svg>
  );
};

export default Logo;
