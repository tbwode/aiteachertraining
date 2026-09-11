import type { CSSProperties } from 'react';
import type { AdminIconName } from '../_config/adminConfig';

type IconProps = {
  name: AdminIconName;
  className?: string;
  style?: CSSProperties;
};

const iconPaths: Record<AdminIconName, JSX.Element> = {
  'graduation-cap': (
    <>
      <path d="M3 9 12 4l9 5-9 5-9-5Z" />
      <path d="M7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  settings: (
    <>
      <path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
      <path d="m19.4 15 1.2 2.1-2.1 1.2-.7 2.3h-2.4L13.8 23h-3.6l-1.2-2.4H6.6l-.7-2.3-2.1-1.2L5 15l-1.2-2.1 2.1-1.2.7-2.3H9L10.2 7h3.6l1.2 2.4h2.4l.7 2.3 2.1 1.2L19.4 15Z" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a1 1 0 0 1 1-1h10v17" />
      <path d="M15 10h4a1 1 0 0 1 1 1v10" />
      <path d="M8 8h2" />
      <path d="M8 12h2" />
      <path d="M8 16h2" />
      <path d="M12 21v-4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 5 3.4 8.6 7 10 3.6-1.4 7-5 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7L15 10" />
    </>
  ),
  'file-text': (
    <>
      <path d="M8 3h7l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M15 3v5h5" />
      <path d="M10 12h6" />
      <path d="M10 16h6" />
    </>
  ),
  newspaper: (
    <>
      <path d="M5 7h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" />
      <path d="M7 5h10" />
      <path d="M8.5 11h2.5" />
      <path d="M13 11h3" />
      <path d="M8.5 15h7.5" />
    </>
  ),
  'book-open': (
    <>
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H12v15H5.5A2.5 2.5 0 0 0 3 21.5v-15Z" />
      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H12v15h6.5a2.5 2.5 0 0 1 2.5 2.5v-15Z" />
    </>
  ),
  bookmark: (
    <>
      <path d="M7 4h10v16l-5-3-5 3V4Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16.5 5.2a3 3 0 0 1 0 5.6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  'user-check': (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 20a7 7 0 0 1 14 0" />
      <path d="m16 11 2 2 4-4" />
    </>
  ),
  library: (
    <>
      <path d="M4 19V6" />
      <path d="M8 19V5" />
      <path d="M12 19V8" />
      <path d="M16 19V4" />
      <path d="M20 19V9" />
      <path d="M3 19h18" />
    </>
  ),
  'clipboard-list': (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4.5h6" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h4" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 1v4M15 1v4M9 19v4M15 19v4M19 9h4M19 15h4M1 9h4M1 15h4" />
    </>
  ),
  'app-window': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 7h.01M12 7h.01" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M9 10h12" />
    </>
  ),
  'book-marked': (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      <path d="m5 14 .7 1.6L7.3 16l-1.6.7L5 18.3l-.7-1.6L2.7 16l1.6-.7L5 14Z" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="m3 12 9 4.5 9-4.5" />
      <path d="m3 16.5 9 4.5 9-4.5" />
    </>
  ),
  folder: (
    <>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.89l-.82-1.22A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </>
  ),
  'folder-open': (
    <>
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.89l.82 1.22a2 2 0 0 0 1.66.89H18a2 2 0 0 1 2 2v2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-6" />
      <path d="M4 9V3" />
      <path d="M12 21v-9" />
      <path d="M12 9V3" />
      <path d="M20 21v-5" />
      <path d="M20 9V3" />
      <path d="M1 15h6" />
      <path d="M9 12h6" />
      <path d="M17 16h6" />
    </>
  )
};

export function AdminIcon({ name, className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{
        width: '20px',
        height: '20px',
        display: 'block',
        flex: '0 0 auto',
        ...style
      }}
    >
      {iconPaths[name]}
    </svg>
  );
}
