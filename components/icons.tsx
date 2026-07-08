/** 시안에서 인라인으로 쓰던 SVG 아이콘 모음. 색은 currentColor 로 상속받는다. */

export function WaveLogo({ size = 16, stroke = "#eafeff" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M2 12 H7 L9 6 L13 18 L15.5 12 H22"
        fill="none"
        stroke={stroke}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlertTriangle({ size = 15, strokeWidth = 2.3 }: { size?: number; strokeWidth?: number }) {
  const r = (strokeWidth / 2.3) * 1.15;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 3.4 L22 20 L2 20 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <line x1="12" y1="9.4" x2="12" y2="14.2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="17.2" r={r} fill="currentColor" />
    </svg>
  );
}

export function CheckMark({ size = 13, strokeWidth = 2.6, stroke = "currentColor" }: { size?: number; strokeWidth?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRight({ size = 12, strokeWidth = 2.4 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeft({ size = 15, strokeWidth = 2.4 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
