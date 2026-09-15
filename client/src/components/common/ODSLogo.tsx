import React from 'react';

interface ODSLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  roleSubtitle?: string;
  className?: string;
}

export default function ODSLogo({
  size = 'md',
  showText = true,
  roleSubtitle = 'NETWORK ADMIN',
  className = '',
}: ODSLogoProps) {
  const sizeClasses = {
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-5 h-5', title: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-6 h-6', title: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-7 h-7', title: 'text-lg', sub: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Gold Rounded Icon Badge */}
      <div
        className={`${sizeClasses.box} bg-gradient-to-br from-[#F5E189] via-[#EDC45B] to-[#BE9B49] flex items-center justify-center shadow-md shrink-0 border border-amber-300/40`}
      >
        {/* Authentic ODS Shield / Global Network Mark (PDF Page 4) */}
        <svg
          className={`${sizeClasses.icon} text-[#0F285B]`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield Outline */}
          <path
            d="M12 2.5L4 5.8V11.2C4 16.3 7.4 20.8 12 22C16.6 20.8 20 16.3 20 11.2V5.8L12 2.5Z"
            stroke="#0F285B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Internal Global Network Arc & Ring */}
          <ellipse
            cx="12"
            cy="11.5"
            rx="4.5"
            ry="4.5"
            stroke="#0F285B"
            strokeWidth="1.6"
            strokeDasharray="1 1.5"
          />
          <path
            d="M12 7V16M7.5 11.5H16.5"
            stroke="#0F285B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${sizeClasses.title} font-extrabold tracking-tight text-white leading-tight`}>
            ODS Global
          </span>
          {roleSubtitle && (
            <span className={`${sizeClasses.sub} font-black uppercase tracking-widest text-[#EDC45B]`}>
              {roleSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
