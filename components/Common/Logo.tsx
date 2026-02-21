
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  // Definition der Größenklassen basierend auf dem size-Prop
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const iconSvgSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-5xl' : 'text-3xl';
  const waveHeight = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-4';
  const waveBottom = size === 'sm' ? '-bottom-2' : size === 'lg' ? '-bottom-5' : '-bottom-4';
  
  // Im kleinen Modus (Header) nutzen wir ein horizontales Layout
  const containerClasses = size === 'sm' 
    ? `flex flex-row items-center gap-3 ${className}` 
    : `flex flex-col items-center ${className}`;

  const iconGroupClasses = size === 'sm'
    ? "flex gap-1.5 order-2"
    : "flex gap-2 self-end mb-1 mr-4";

  return (
    <div className={containerClasses}>
      {/* Die drei Icons */}
      <div className={iconGroupClasses}>
        {/* Cyan Box - Wellen */}
        <div className={`${iconSize} rounded-lg md:rounded-xl border-2 border-[#5ecce5] flex items-center justify-center p-0.5`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" className={iconSvgSize}>
            <path d="M2 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
            <path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity="0.7" />
          </svg>
        </div>
        {/* Orange Box - Smiley */}
        <div className={`${iconSize} rounded-lg md:rounded-xl border-2 border-[#f9a825] flex items-center justify-center p-0.5`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" className={iconSvgSize}>
            <circle cx="12" cy="12" r="9" />
            <path d="M9 10h.01M15 10h.01" strokeWidth="3" />
            <path d="M8 15a5 5 0 0 0 8 0" />
          </svg>
        </div>
        {/* Pink Box - Fisch */}
        <div className={`${iconSize} rounded-lg md:rounded-xl border-2 border-[#e91e63] flex items-center justify-center p-0.5`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" className={iconSvgSize}>
            <path d="M19.5 12c0 2.5-4 4.5-9 4.5s-9-2-9-4.5 4-4.5 9-4.5 9 2 9 4.5Z" />
            <path d="M22 9l-3 3 3 3" />
            <circle cx="16" cy="12" r="0.5" fill="#333" />
          </svg>
        </div>
      </div>

      {/* Schriftzug */}
      {showText && (
        <div className="relative order-1">
          <h1 className={`${textSize} font-black tracking-tight text-slate-900 flex items-baseline`}>
            schwimm<span className="text-[#5ecce5]">ka</span>jede<span className="text-[#5ecce5]">:</span>r
          </h1>
          {/* Cyan Welle unten */}
          <div className={`absolute ${waveBottom} left-0 w-full ${waveHeight} overflow-visible`}>
            <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="w-full h-full opacity-60">
              <path 
                d="M0,15 C50,5 100,25 150,15 C200,5 250,25 300,15" 
                stroke="#5ecce5" 
                strokeWidth="5" 
                fill="none" 
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
