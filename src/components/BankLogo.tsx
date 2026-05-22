import React, { useState, memo } from 'react';
import { clsx } from 'clsx';
import { Bank, LogoShape } from '../types';

interface BankLogoProps {
  bank: Bank;
  customLogo?: string;
  logoShape: LogoShape;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const BankLogo: React.FC<BankLogoProps> = memo(({ 
  bank, 
  customLogo, 
  logoShape, 
  className,
  size = 'md'
}) => {
  const [error, setError] = useState(false);
  
  const logoUrl = customLogo || bank.logoUrl;

  const sizeClasses = {
    xs: logoShape === 'rectangle' ? 'w-5 h-7 text-[7px]' : 'w-5 h-5 text-[7px]',
    sm: logoShape === 'rectangle' ? 'w-6 h-8 text-[8px]' : 'w-6 h-6 text-[8px]',
    md: logoShape === 'rectangle' ? 'w-9 h-12 text-xs' : 'w-9 h-9 text-xs',
    lg: logoShape === 'rectangle' ? 'w-10 h-14 text-base' : 'w-10 h-10 text-base',
  };

  const shapeClasses = {
    circle: 'rounded-full aspect-square',
    square: 'rounded-[22%] aspect-square',
    rectangle: 'rounded-[15%]',
    octagon: 'clip-octagon aspect-square'
  };

  const shapePaddings = {
    circle: 'p-[16%]',
    square: 'p-[12%]',
    rectangle: 'p-[10%]',
    octagon: 'p-[15%]'
  };

  if (logoUrl && !error) {
    const isSpriteLogo = logoUrl.startsWith('/logos/') && !logoUrl.endsWith('bank-icon.svg');
    const spriteId = isSpriteLogo ? logoUrl.match(/\/logos\/([^/.]+)\.svg$/)?.[1] : null;

    return (
      <div
        className={clsx(
          "flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-white/10 bg-transparent shadow-sm overflow-hidden",
          sizeClasses[size],
          shapeClasses[logoShape],
          shapePaddings[logoShape],
          className
        )}
      >
        {spriteId ? (
          <svg 
            className="w-full h-full select-none transform translate-z-0"
            viewBox="0 0 600 600"
            style={{ pointerEvents: 'none' }}
          >
            <use href={`#${spriteId}`} />
          </svg>
        ) : (
          <img
            src={logoUrl}
            alt={bank.name}
            onError={() => setError(true)}
            className="w-full h-full object-contain object-center select-none"
            style={{ 
              imageRendering: '-webkit-optimize-contrast'
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-center text-white font-bold shadow-sm shrink-0 border border-slate-200/50 dark:border-white/10 overflow-hidden",
        sizeClasses[size],
        shapeClasses[logoShape],
        className
      )}
      style={{ backgroundColor: bank.color }}
    >
      <span className={clsx(
        "font-black select-none tracking-tight leading-none uppercase",
        size === 'xs' && 'text-[7px]',
        size === 'sm' && 'text-[8px]',
        size === 'md' && 'text-[11px]',
        size === 'lg' && 'text-[13px]'
      )}>
        {bank.logoText}
      </span>
    </div>
  );
});
