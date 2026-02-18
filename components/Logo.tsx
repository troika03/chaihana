
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
      {/* Внешнее кольцо */}
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="1.5" />
      <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="0.5" opacity="0.3" />
      
      {/* Текст по дуге */}
      {!hideText && (
        <>
          <defs>
            <path id="archPathLogo" d="M 22,50 A 28,28 0 0 1 78,50" />
          </defs>
          <text fill={color} fontSize="5.5" fontWeight="900" style={{ letterSpacing: '0.08em', fontFamily: 'serif' }}>
            <textPath href="#archPathLogo" startOffset="50%" textAnchor="middle">
              ЧАЙХАНА ЖУЛЕБИНО
            </textPath>
          </text>
        </>
      )}

      {/* Чаша (Пиала) */}
      <path 
        d="M32 55H68C68 55 68 68 50 68C32 68 32 55 32 55Z" 
        fill={color} 
      />
      <path 
        d="M32 55C32 55 35 58 50 58C65 58 68 55 68 55" 
        stroke="white" 
        strokeWidth="0.5" 
        opacity="0.3"
      />
      <rect x="44" y="68" width="12" height="3" rx="1" fill={color} />

      {/* Пар над чашей */}
      <path 
        d="M45 50C45 50 47 48 45 46C43 44 45 42 45 42" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        opacity="0.8"
      />
      <path 
        d="M50 52C50 52 52 49 50 46C48 43 50 40 50 40" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M55 50C55 50 57 48 55 46C53 44 55 42 55 42" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        opacity="0.8"
      />
    </svg>
  );
};

export default Logo;
