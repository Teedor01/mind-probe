export function MountainIllustration() {
  return (
    <svg viewBox="0 0 320 140" className="w-full h-32 rounded-xl" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B7CFC" />
          <stop offset="100%" stopColor="#6D5FFB" />
        </linearGradient>
        <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B4A9FF" />
          <stop offset="100%" stopColor="#9A8CFF" />
        </linearGradient>
        <linearGradient id="skyBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDEAFF" />
          <stop offset="100%" stopColor="#F7F6FF" />
        </linearGradient>
      </defs>
      <rect width="320" height="140" fill="url(#skyBg)" />
      <path d="M0 130 L70 55 L110 90 L170 30 L230 85 L320 45 L320 140 L0 140 Z" fill="url(#mtn2)" opacity="0.55" />
      <path d="M0 140 L60 80 L120 120 L190 45 L250 100 L320 70 L320 140 Z" fill="url(#mtn1)" />
      <path
        d="M20 108 C 70 40, 140 118, 190 44 C 220 8, 260 20, 296 24"
        stroke="#FFFFFF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="1 9"
        opacity="0.9"
      />
      <circle cx="296" cy="24" r="5" fill="#FFFFFF" />
    </svg>
  );
}
