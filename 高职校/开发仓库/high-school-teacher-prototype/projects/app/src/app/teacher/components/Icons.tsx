'use client';

import type { SVGProps } from 'react';

export function SchoolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M6 10.5V15l6 3 6-3v-4.5" />
    </svg>
  );
}

export function GraduationCapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M2 9 12 4l10 5-10 5L2 9Z" />
      <path d="M6 11.5V16l6 3 6-3v-4.5" />
      <path d="M22 10v6" />
    </svg>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 13h8V3H3v10Z" />
      <path d="M13 21h8v-6h-8v6Z" />
      <path d="M13 11h8V3h-8v8Z" />
      <path d="M3 21h8v-6H3v6Z" />
    </svg>
  );
}

export function CourseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 19.5V6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

export function StudentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.3" />
    </svg>
  );
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z" />
    </svg>
  );
}

export function FolderOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 14h12l2-9H8l-2 9Z" />
      <path d="M2 14h20" />
    </svg>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function LoadingClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#clip0_1648_16636)">
        <path d="M3.03711 9.37951C3.03711 10.1765 3.19409 10.9657 3.49908 11.702C3.80408 12.4383 4.25111 13.1074 4.81467 13.6709C5.37822 14.2345 6.04726 14.6815 6.78358 14.9865C7.5199 15.2915 8.30909 15.4485 9.10607 15.4485C9.90306 15.4485 10.6922 15.2915 11.4286 14.9865C12.1649 14.6815 12.8339 14.2345 13.3975 13.6709C13.961 13.1074 14.4081 12.4383 14.7131 11.702C15.0181 10.9657 15.175 10.1765 15.175 9.37951C15.175 7.76992 14.5356 6.22626 13.3975 5.08811C12.2593 3.94995 10.7157 3.31055 9.10607 3.31055C7.49649 3.31055 5.95282 3.94995 4.81467 5.08811C3.67652 6.22626 3.03711 7.76992 3.03711 9.37951Z" fill="#D8D8D8" />
        <path d="M8.00073 16C3.58253 16 0.000736237 12.4182 0.000736237 8C0.000736237 3.58179 3.58253 0 8.00073 0C11.0727 0 13.7403 1.73159 15.0807 4.272C15.1682 4.43263 15.1883 4.62144 15.1366 4.7969C15.0849 4.97235 14.9656 5.12008 14.805 5.20759C14.6444 5.29509 14.4556 5.3152 14.2801 5.26349C14.1047 5.21178 13.9569 5.09249 13.8694 4.93186C12.7629 2.82014 10.55 1.37931 8.00073 1.37931C4.34418 1.37931 1.38004 4.34345 1.38004 8C1.38004 11.6566 4.34418 14.6207 8.00073 14.6207C11.1571 14.6207 13.798 12.4116 14.4609 9.45517L13.2697 10.1429C13.1114 10.2329 12.9239 10.2566 12.7481 10.2089C12.5724 10.1612 12.4226 10.0459 12.3316 9.8882C12.2405 9.73049 12.2155 9.54316 12.2621 9.36709C12.3086 9.19102 12.4229 9.04052 12.58 8.94841L14.969 7.5691C15.0814 7.50413 15.2098 7.47218 15.3395 7.47693C15.4692 7.48168 15.5949 7.52293 15.7022 7.59595C15.8095 7.66896 15.8941 7.77078 15.9461 7.88969C15.9981 8.0086 16.0155 8.13977 15.9963 8.26814L15.9983 8.2C15.8923 12.5258 12.3522 16 8.00073 16Z" fill="#333333" />
        <path d="M7.93875 3.37401C7.7559 3.36962 7.57879 3.43805 7.4464 3.56424C7.314 3.69044 7.23715 3.86405 7.23276 4.0469L7.14576 7.68763L5.73546 8.02925C5.64711 8.05027 5.56377 8.08854 5.49025 8.14185C5.41672 8.19516 5.35445 8.26247 5.307 8.33991C5.25956 8.41736 5.22788 8.50341 5.21378 8.59313C5.19968 8.68285 5.20344 8.77447 5.22485 8.86273C5.24626 8.95099 5.28488 9.03416 5.33852 9.10745C5.39215 9.18075 5.45973 9.24272 5.53738 9.28983C5.61503 9.33693 5.70122 9.36824 5.79101 9.38194C5.88079 9.39565 5.97239 9.39148 6.06056 9.36969L7.93735 8.9148C8.06258 8.88473 8.17683 8.82004 8.26703 8.72811C8.34189 8.66522 8.40248 8.58709 8.44477 8.49894C8.48705 8.41078 8.51005 8.31462 8.51223 8.21688L8.6115 4.08023C8.6137 3.98968 8.59805 3.89959 8.56543 3.81509C8.53281 3.7306 8.48387 3.65336 8.4214 3.58778C8.35893 3.5222 8.28415 3.46956 8.20133 3.43288C8.11852 3.39621 8.02929 3.3762 7.93875 3.37401Z" fill="#333333" />
      </g>
      <defs>
        <clipPath id="clip0_1648_16636">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
