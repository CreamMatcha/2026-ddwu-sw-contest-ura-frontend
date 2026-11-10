import type { ReactNode } from 'react';

export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'calendar'
  | 'timetable'
  | 'sofa'
  | 'megaphone'
  | 'camera'
  | 'image'
  | 'pencil'
  | 'trash'
  | 'plus'
  | 'close'
  | 'refresh'
  | 'check'
  | 'alert-circle'
  | 'door'
  | 'logo';

const PATHS: Record<IconName, ReactNode> = {
  'chevron-left': <path d="M15 5l-7 7 7 7" />,
  'chevron-right': <path d="M9 5l7 7-7 7" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  timetable: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M9 9v12M15 9v12" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v5H3z" />
      <path d="M6 18v2M18 18v2" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10v4h4l6 4V6L7 10H3z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 17l-5-5-9 8" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  door: (
    <>
      <path d="M4 21h16M6 21V4h12v17" />
      <circle cx="14.5" cy="12.5" r="1" />
    </>
  ),
  logo: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 3v18M3 12h18" />
      <rect x="14.5" y="14.5" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** 지정하면 의미 있는 이미지로 읽힘, 없으면 장식용(aria-hidden) */
  label?: string;
  className?: string;
}

/** 24 그리드, stroke 2, round cap/join */
export function Icon({ name, size = 24, strokeWidth = 2, label, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {PATHS[name]}
    </svg>
  );
}
