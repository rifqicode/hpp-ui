import { cn } from '@/lib/utils';

interface SofiVectorAvatarProps {
  className?: string;
  size?: number | string;
}

export function SofiVectorAvatar({ className, size }: SofiVectorAvatarProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Sofi Asisten AI"
      role="img"
    >
      <defs>
        <linearGradient id="sofi-body-grad" x1="12" y1="20" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="sofi-screen-grad" x1="18" y1="26" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id="sofi-hat-grad" x1="20" y1="6" x2="44" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="sofi-eye-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#38BDF8" floodOpacity={0.8} />
        </filter>
      </defs>

      {/* Left & Right Ear Connectors */}
      <rect x="8" y="32" width="5" height="11" rx="2.5" fill="url(#sofi-body-grad)" stroke="#4338CA" strokeWidth="0.75" />
      <rect x="51" y="32" width="5" height="11" rx="2.5" fill="url(#sofi-body-grad)" stroke="#4338CA" strokeWidth="0.75" />

      {/* Robot Head Base */}
      <rect x="12" y="21" width="40" height="34" rx="13" fill="url(#sofi-body-grad)" stroke="#4338CA" strokeWidth="1" />

      {/* Head Highlight */}
      <path d="M17 24 C24 22 40 22 47 24" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Face Screen (Visor) */}
      <rect x="17" y="27" width="30" height="21" rx="7.5" fill="url(#sofi-screen-grad)" stroke="#312E81" strokeWidth="0.75" />

      {/* Cute Smiling Glowing Cyan Eyes (^ ^) */}
      <g filter="url(#sofi-eye-glow)">
        <path d="M22 38.5 C23 35.5 25.5 35.5 26.5 38.5" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M37.5 38.5 C38.5 35.5 41 35.5 42 38.5" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>

      {/* Cute Blush Cheeks */}
      <circle cx="21.5" cy="42" r="1.5" fill="#F43F5E" opacity="0.45" />
      <circle cx="42.5" cy="42" r="1.5" fill="#F43F5E" opacity="0.45" />

      {/* Tiny Cute Mouth Smile */}
      <path d="M30.5 42 Q32 43.5 33.5 42" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.85" />

      {/* Chef Hat (Toque) */}
      <ellipse cx="32" cy="22" rx="14" ry="2.5" fill="#312E81" opacity="0.3" />

      {/* Hat Puffs */}
      <g fill="url(#sofi-hat-grad)" stroke="#CBD5E1" strokeWidth="1" strokeLinejoin="round">
        <circle cx="24.5" cy="13.5" r="7" />
        <circle cx="39.5" cy="13.5" r="7" />
        <circle cx="32" cy="11.5" r="8.5" />
      </g>

      {/* Hat Band / Base */}
      <rect x="20" y="17.5" width="24" height="5" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.75" />
      <line x1="28" y1="18.5" x2="28" y2="21.5" stroke="#E2E8F0" strokeWidth="0.75" strokeLinecap="round" />
      <line x1="36" y1="18.5" x2="36" y2="21.5" stroke="#E2E8F0" strokeWidth="0.75" strokeLinecap="round" />

      {/* Chef Neckerchief / Ribbon */}
      <path d="M29 55 L32 58 L35 55 Z" fill="#F43F5E" />
      <ellipse cx="32" cy="54.5" rx="2.5" ry="1.5" fill="#FB7185" />
    </svg>
  );
}

// Backward-compatibility export
export { SofiVectorAvatar as BobiVectorAvatar };
