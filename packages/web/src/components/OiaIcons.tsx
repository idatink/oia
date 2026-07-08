/*
 * Oia Icon Library
 * ────────────────
 * A bespoke, single-weight line-icon set drawn on a 24px grid.
 * - stroke: currentColor (inherits text color — terracotta, charcoal, etc.)
 * - 1.6px stroke, round caps + joins, no fills
 * - Purpose-built for Oia's surgical-journey world. No generic icon packs, no emoji.
 *
 * Usage:  <IcPlane size={18} className="text-primary" />
 */
import type { CSSProperties, ReactNode } from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

function make(paths: ReactNode, viewBox = '0 0 24 24') {
  function OiaIcon({ size = 24, className, strokeWidth = 1.6, style }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  }
  return OiaIcon;
}

/* ── The Oia mark — a four-point spark (also used for AI / concierge) ── */
export const IcSpark = make(
  <>
    <path d="M12 3c.45 5.2 2.15 6.9 7.2 7.35-5.05.45-6.75 2.15-7.2 7.2-.45-5.05-2.15-6.75-7.2-7.2C9.85 9.9 11.55 8.2 12 3Z" />
  </>,
);
export const IcSparkDuo = make(
  <>
    <path d="M10 3c.38 4.3 1.78 5.7 6 6.1-4.22.4-5.62 1.8-6 6.1-.38-4.3-1.78-5.7-6-6.1C8.22 8.7 9.62 7.3 10 3Z" />
    <path d="M17.5 13.5c.16 1.9.83 2.55 2.7 2.7-1.87.16-2.54.82-2.7 2.7-.16-1.88-.82-2.54-2.7-2.7 1.88-.15 2.54-.8 2.7-2.7Z" />
  </>,
);

/* ── Journey / itinerary ── */
export const IcPlane = make(<path d="M21 3 3.4 10.4l6.7 2.5 2.5 6.7L21 3Zm0 0-8.4 9.9" />);
export const IcSuite = make(
  <>
    <path d="M3 18v-6.2A1.8 1.8 0 0 1 4.8 10h14.4A1.8 1.8 0 0 1 21 11.8V18" />
    <path d="M3 15h18M3 18v2M21 18v2" />
    <path d="M6.8 10V8.6A1.6 1.6 0 0 1 8.4 7h3.2A1.6 1.6 0 0 1 13.2 8.6V10" />
  </>,
);
export const IcClinic = make(
  <>
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M3 21h18" />
    <path d="M12 8.4v4.2M9.9 10.5h4.2" />
  </>,
);
export const IcProcedure = make(<path d="M3 12h3.8l2.4-5 3.6 10 2.4-5H21" />);
export const IcRecovery = make(
  <>
    <path d="M12 20.5v-8.7" />
    <path d="M12 11.8C12 8.4 9.6 6 6.2 6c0 3.4 2.4 5.8 5.8 5.8Z" />
    <path d="M12 10.8c0-3 2.2-5.4 5.4-5.4C17.4 8.4 15 10.8 12 10.8Z" />
  </>,
);
export const IcHome = make(
  <>
    <path d="M4 21v-9.6L12 5l8 6.4V21" />
    <path d="M9.5 21v-5.8h5V21" />
  </>,
);
export const IcTransfer = make(
  <>
    <path d="M4 16.2 5.4 11A2 2 0 0 1 7.3 9.5h9.4A2 2 0 0 1 18.6 11L20 16.2" />
    <path d="M4 16.2h16v3H4zM7.2 19.2v1.4M16.8 19.2v1.4M7.6 13h8.8" />
  </>,
);
export const IcPin = make(
  <>
    <path d="M12 21c4-4.4 6-7.6 6-10.6a6 6 0 1 0-12 0C6 13.4 8 16.6 12 21Z" />
    <circle cx="12" cy="10.4" r="2.2" />
  </>,
);

/* ── Trust / scheduling ── */
export const IcShieldCheck = make(
  <>
    <path d="M12 3 19 5.4v6c0 4.3-3 7.2-7 8.6-4-1.4-7-4.3-7-8.6v-6z" />
    <path d="M9 12l2 2 4-4" />
  </>,
);
export const IcCalendar = make(
  <>
    <rect x="4" y="6" width="16" height="14" rx="1.6" />
    <path d="M4 10h16M8 3.6v4M16 3.6v4" />
  </>,
);
export const IcClock = make(
  <>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.6V12l3 2" />
  </>,
);

/* ── Recovery kit / products ── */
export const IcVest = make(
  <>
    <path d="M8.6 3 5 6.6l.9 2.3 2-1V21h8.2V7.9l2 1 .9-2.3L15.4 3" />
    <path d="M8.6 3a3.6 3 0 0 0 6.8 0" />
  </>,
);
export const IcLeggings = make(<path d="M8 3h8l.6 8.2-1 9.8h-3.2L12 12.5l-.4 8.5H8.4l-1-9.8z" />);
export const IcCapsule = make(
  <>
    <rect x="3.6" y="8.6" width="16.8" height="6.8" rx="3.4" />
    <path d="M12 8.8v6.4" />
  </>,
);
export const IcSerum = make(
  <>
    <path d="M9.6 3h4.8M10.6 3v3.2M13.4 3v3.2" />
    <path d="M8.6 9.2A2 2 0 0 1 10.6 7.2h2.8a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-2.8a2 2 0 0 1-2-2z" />
    <path d="M8.6 12.6h6.8" />
  </>,
);
export const IcPillow = make(
  <>
    <rect x="4.5" y="6.5" width="15" height="11" rx="3.6" />
    <path d="M7.2 7.4c.9 1.5.9 3.3 0 4.8M16.8 16.6c-.9-1.5-.9-3.3 0-4.8" />
  </>,
);
export const IcSnowflake = make(
  <>
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    <path d="M12 6.6 14 4.6M12 6.6 10 4.6M12 17.4l2 2M12 17.4l-2 2" />
  </>,
);
export const IcBox = make(
  <>
    <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
    <path d="M4 8l8 4 8-4M12 12v8" />
  </>,
);

/* ── Care & conversation ── */
export const IcChat = make(<path d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v7A1.5 1.5 0 0 1 18 14.5H9l-4.5 3.5z" />);
export const IcHeart = make(<path d="M12 20C6.5 16 4 12.7 4 9.3A3.8 3.8 0 0 1 11.4 8a.7.7 0 0 0 1.2 0A3.8 3.8 0 0 1 20 9.3c0 3.4-2.5 6.7-8 10.7Z" />);
export const IcActivity = make(<path d="M5 20v-9M9.7 20V5M14.3 20v-6M19 20V8" />);
export const IcProfile = make(
  <>
    <circle cx="12" cy="8.4" r="3.8" />
    <path d="M5 20c0-3.7 3.1-5.6 7-5.6s7 1.9 7 5.6" />
  </>,
);

/* ── Account / documents ── */
export const IcDocument = make(
  <>
    <path d="M6.5 3h7l4 4v14h-11z" />
    <path d="M13.5 3v4h4" />
    <path d="M9 12h6M9 15h4" />
  </>,
);
export const IcBell = make(
  <>
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 5.5 1.8 5.5H4.2S6 14 6 9.5Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </>,
);
export const IcLock = make(
  <>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2" />
  </>,
);
export const IcCard = make(
  <>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18M6.5 14.5h3.5" />
  </>,
);

/* ── UI / controls ── */
export const IcPlus = make(<path d="M12 5v14M5 12h14" />);
export const IcCheck = make(<path d="M5 12.5l4.5 4.5L19 7" />);
export const IcChevronRight = make(<path d="M9 5l7 7-7 7" />);
export const IcChevronLeft = make(<path d="M15 5l-7 7 7 7" />);
export const IcChevronDown = make(<path d="M5 9l7 7 7-7" />);
export const IcArrowRight = make(<path d="M4 12h15M13 6l6 6-6 6" />);
export const IcEdit = make(
  <>
    <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17z" />
    <path d="M14 7l3 3" />
  </>,
);
export const IcMic = make(
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </>,
);
export const IcWaveform = make(<path d="M4 12v0M7.5 8.5v7M11 5.5v13M14.5 9v6M18 7v10M20.5 11v2" />);
export const IcMute = make(
  <>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
  </>,
);
export const IcKeyboard = make(
  <>
    <rect x="3" y="7" width="18" height="10" rx="2" />
    <path d="M7 10h.02M11 10h.02M15 10h.02M17.4 10h.02M7 13.2h10" />
  </>,
);
