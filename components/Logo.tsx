
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
      {/* Внешние концентрические круги (двойная рамка из логотипа) */}
      <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="1.2" />
      <circle cx="50" cy="50" r="41" stroke={color} strokeWidth="0.8" />
      
      {/* Текст по верхней дуге */}
      {!hideText && (
        <>
          <defs>
            <path id="archPathLogo" d="M 28,50 A 22,22 0 0 1 72,50" />
          </defs>
          <text fill={color} fontSize="4.8" fontWeight="500" style={{ letterSpacing: '0.02em', fontFamily: 'serif' }}>
            <textPath href="#archPathLogo" startOffset="50%" textAnchor="middle">
              ЧАЙХАНА ЖУЛЕБИНО
            </textPath>
          </text>
        </>
      )}

      {/* Центральный элемент: Пиала (Чаша) */}
      <g transform="translate(0, 4)">
        <path 
          d="M38 58H62C62 58 61 68 50 68C39 68 38 58 38 58Z" 
          fill={color} 
        />
        {/* Ножка пиалы */}
        <path d="M47 68H53L52 70H48L47 68Z" fill={color} />
        
        {/* Три линии пара как на фото */}
        <path 
          d="M48 55C48 55 49 53 48 51C47 49 48 47 48 47" 
          stroke={color} 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.8"
        />
        <path 
          d="M50 54C50 54 51 51 50 48C49 45 50 42 50 42" 
          stroke={color} 
          strokeWidth="1.2" 
          strokeLinecap="round"
        />
        <path 
          d="M52 55C52 55 53 53 52 51C51 49 52 47 52 47" 
          stroke={color} 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.8"
        />
      </g>
    </svg>
  );
};

export default Logo;
