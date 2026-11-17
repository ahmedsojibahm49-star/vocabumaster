// Iconsax-style linear icons: 24×24, 1.6px rounded strokes, no fill.
// One consistent set used across the whole site (replaces emoji icons).

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function Base({
  size = 20,
  className,
  strokeWidth = 1.6,
  children,
}: IconProps & { children: React.ReactNode }) {
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
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.2v2" />
    </Base>
  );
}

export function IconFile(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.2Z" />
      <path d="M14 3.5v4.7h4.5" />
      <path d="M9 13h6M9 16.5h4" />
    </Base>
  );
}

export function IconHome(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M3.5 10.8 12 3.5l8.5 7.3" />
      <path d="M5.5 9.3V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.3" />
    </Base>
  );
}

export function IconBook(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 6.2C10.1 4.8 7.7 4.2 4 4.2v13.6c3.7 0 6.1.6 8 2 1.9-1.4 4.3-2 8-2V4.2c-3.7 0-6.1.6-8 2Z" />
      <path d="M12 6.2v13.6" />
    </Base>
  );
}

export function IconGrammar(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M13.5 3.5v5.5H19" />
      <path d="M9.5 13h5M9.5 16.5h5" />
    </Base>
  );
}

export function IconVideo(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="3.5" />
      <path d="M10.2 9.3v5.4c0 .6.65.97 1.16.66l4.3-2.7a.78.78 0 0 0 0-1.32l-4.3-2.7a.78.78 0 0 0-1.16.66Z" />
    </Base>
  );
}

export function IconClipboard(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="5.5" y="4.5" width="13" height="17" rx="2.5" />
      <path d="M9 4.5a3 3 0 0 1 6 0" />
      <path d="m9 14.6 2.1 2.1 4-4.2" />
    </Base>
  );
}

export function IconGrid(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
    </Base>
  );
}

export function IconEyeSlash(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4.2 4.5 19.8 19.5" />
      <path d="M10.6 6.1A9.4 9.4 0 0 1 12 6c6 0 9.2 6 9.2 6a17.6 17.6 0 0 1-2.7 3.2M6.1 8A16.9 16.9 0 0 0 2.8 12S6 18 12 18c1.2 0 2.3-.3 3.3-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Base>
  );
}

export function IconPhone(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5.2 3.8h3l1.2 4.2-2 1.6a12.6 12.6 0 0 0 5.5 5.5l1.6-2 4.2 1.2v3a2.4 2.4 0 0 1-2.6 2.4C9.9 19 5 14.1 4.9 7.9a2.4 2.4 0 0 1 .3-4.1Z" />
    </Base>
  );
}

export function IconShield(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 3 5 5.6v5.2c0 4.6 3 8 7 9.7 4-1.7 7-5.1 7-9.7V5.6L12 3Z" />
      <path d="m9.2 11.6 2 2 3.6-3.9" />
    </Base>
  );
}

export function IconInfo(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconSliders(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 7h9M17.5 7H20M4 17h3.5M12 17h8" />
      <circle cx="15" cy="7" r="2.3" />
      <circle cx="9.5" cy="17" r="2.3" />
    </Base>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </Base>
  );
}

export function IconSun(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </Base>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M20.2 13.6A8.4 8.4 0 1 1 10.4 3.8a6.7 6.7 0 0 0 9.8 9.8Z" />
    </Base>
  );
}

export function IconStar(p: IconProps) {
  return (
    <Base {...p}>
      <path d="m12 3.6 2.5 5.2 5.7.7-4.2 4 1.1 5.6L12 16.4l-5.1 2.7L8 13.5l-4.2-4 5.7-.7L12 3.6Z" />
    </Base>
  );
}

export function IconFlame(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 21.5a6.8 6.8 0 0 0 6.8-6.8c0-2.9-1.8-5-3.4-6.9-.5 1-1.2 1.8-2.1 2.3.2-2.9-.7-5.9-3.1-7.9.3 3.1-.9 4.7-2.2 6.3A7.4 7.4 0 0 0 5.2 14.7 6.8 6.8 0 0 0 12 21.5Z" />
      <path d="M12 21.5a3.4 3.4 0 0 1-3.4-3.4c0-1.5.8-2.5 1.7-3.4.5-.5 1.1-1.1 1.7-2 .6.9 1.2 1.5 1.7 2 .9.9 1.7 1.9 1.7 3.4A3.4 3.4 0 0 1 12 21.5Z" />
    </Base>
  );
}

export function IconVolume(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 9.8v4.4h3L12 19V5L7 9.8H4Z" />
      <path d="M15.5 9.5a3.6 3.6 0 0 1 0 5M18 7a7.2 7.2 0 0 1 0 10" />
    </Base>
  );
}

export function IconBookmark(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M6.5 3.5h11V21L12 16.8 6.5 21V3.5Z" />
    </Base>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Base {...p} strokeWidth={p.strokeWidth ?? 2}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Base>
  );
}

export function IconCheckCircle(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.4 2.6 2.6 5-5.4" />
    </Base>
  );
}

export function IconX(p: IconProps) {
  return (
    <Base {...p} strokeWidth={p.strokeWidth ?? 2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function IconArrowRight(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 12h15M13.5 6l6 6-6 6" />
    </Base>
  );
}

export function IconArrowLeft(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M20 12H5M10.5 6l-6 6 6 6" />
    </Base>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <Base {...p}>
      <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />
    </Base>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Base {...p} strokeWidth={p.strokeWidth ?? 2}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconTrophy(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M7 4h10v5.5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4a3 3 0 0 0 3.2 4.4M17 5.5h3a3 3 0 0 1-3.2 4.4" />
      <path d="M12 14.5V18M8.5 20.5h7M12 18c-1.2 0-2 .8-2.2 2.5h4.4C14 18.8 13.2 18 12 18Z" />
    </Base>
  );
}

export function IconClock(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </Base>
  );
}

export function IconTarget(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconPlay(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11-7.2a1.05 1.05 0 0 0 0-1.8l-11-7.2A1.05 1.05 0 0 0 7 4.8Z" />
    </Base>
  );
}

export function IconShuffle(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M3.5 7h3.6c1.4 0 2.2.5 3.1 1.6l3.4 4c.9 1 1.7 1.6 3.1 1.6h3.8M3.5 17h3.6c1.4 0 2.2-.5 3.1-1.6l1.3-1.5" />
      <path d="m17.8 4.2 2.7 2.8-2.7 2.8M17.8 11.4l2.7 2.8-2.7 2.8" />
    </Base>
  );
}

export function IconDownload(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 17.5v1.7A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.8-1.8v-1.7" />
    </Base>
  );
}

export function IconMail(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7.5 8 6 8-6" />
    </Base>
  );
}

export function IconUser(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </Base>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M3.5 12h11M10.5 7.5 15 12l-4.5 4.5" />
    </Base>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Base>
  );
}

export function IconSparkle(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 3.5c.6 4.8 2 6.9 6.5 7.7-4.5.8-5.9 2.9-6.5 7.7-.6-4.8-2-6.9-6.5-7.7C10 10.4 11.4 8.3 12 3.5Z" />
      <path d="M18.8 15.5c.2 1.7.7 2.4 2.2 2.7-1.5.3-2 1-2.2 2.7-.2-1.7-.7-2.4-2.2-2.7 1.5-.3 2-1 2.2-2.7Z" />
    </Base>
  );
}

export function IconCards(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="6" width="13" height="15" rx="2.5" transform="rotate(-6 3 6)" />
      <path d="M8.5 4.2 19.6 2.4a2 2 0 0 1 2.3 1.7l1.6 9.8" transform="translate(-3.5 1)" />
    </Base>
  );
}

export function IconWallet(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <circle cx="16.8" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconYoutube(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="2.8" y="6" width="18.4" height="12.5" rx="3.5" />
      <path d="M10.3 9.4v5.2c0 .55.6.9 1.07.61l4-2.6a.72.72 0 0 0 0-1.22l-4-2.6a.72.72 0 0 0-1.07.61Z" />
    </Base>
  );
}

export function IconInstagram(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconChart(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 4v15.2A1.8 1.8 0 0 0 5.8 21H20" />
      <path d="M8.5 16v-4.5M12.5 16V8M16.5 16v-6.5" />
    </Base>
  );
}

export function IconUsers(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="9.5" cy="8.5" r="3.5" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M15.5 5.6a3.5 3.5 0 0 1 0 6.3M17.8 14.6a6 6 0 0 1 2.9 5.4" />
    </Base>
  );
}

export function IconRoute(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3 3 0 0 0 0-6h-6a3 3 0 0 1 0-6h1" />
    </Base>
  );
}

export function IconMessage(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 20.5c-4.9 0-9-3.4-9-8.2S7.1 3.5 12 3.5s9 3.9 9 8.8c0 2-1 3.9-2.4 5.3.1 1.2.5 2.5 1.2 3.6-1.9-.2-3.6-.9-4.9-1.9-1 .3-1.9.4-2.9.4Z" />
      <path d="M7.5 10h9M7.5 13.2h5.5" />
    </Base>
  );
}

export function IconCap(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 5 2.8 9.3 12 13.6l9.2-4.3L12 5Z" />
      <path d="M6.5 11.3V16c0 1.2 2.5 2.7 5.5 2.7s5.5-1.5 5.5-2.7v-4.7M21.2 9.3V15" />
    </Base>
  );
}

export function IconMedal(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="m9.3 10.2-2-6.2h3.4L12 7l1.3-3h3.4l-2 6.2" />
      <path d="m12 11.8 1 1.9 2.1.3-1.5 1.5.35 2.1L12 16.6l-1.95 1-.35-2.1-1.5-1.5 2.1-.3 1-1.9Z" />
    </Base>
  );
}

export function IconPen(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M11.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.5" />
      <path d="M17.8 3.8a1.9 1.9 0 0 1 2.7 2.7L11 16l-3.8 1L8.2 13.2l9.6-9.4Z" />
    </Base>
  );
}

export function IconTrash(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 6.5h16M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6M6.5 6.5 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </Base>
  );
}

export function IconEye(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M2.8 12S6 5.5 12 5.5 21.2 12 21.2 12 18 18.5 12 18.5 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  );
}

export function IconFlag(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5.5 21.5v-17" />
      <path d="M5.5 4.8c2.8-1.7 4.7 1.2 7.5.2 1.8-.7 3.4-.6 5 .3v7.4c-1.6-.9-3.2-1-5-.3-2.8 1-4.7-1.9-7.5-.2" />
    </Base>
  );
}

export function IconLayers(p: IconProps) {
  return (
    <Base {...p}>
      <path d="m12 3.5 9.2 4.8L12 13.1 2.8 8.3 12 3.5Z" />
      <path d="m4.6 12.4 7.4 3.9 7.4-3.9M4.6 16.4 12 20.3l7.4-3.9" />
    </Base>
  );
}

export function IconQuote(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 16.5c-1 0-1.7-.8-1.7-1.9V8.9A3.4 3.4 0 0 1 6.7 5.5h.6v3.2H5.6a.6.6 0 0 0-.6.6v1.6c1.9.3 3 1.7 3 3.4 0 1.3-1 2.2-3 2.2ZM15.5 16.5c-1 0-1.7-.8-1.7-1.9V8.9a3.4 3.4 0 0 1 3.4-3.4h.6v3.2h-1.7a.6.6 0 0 0-.6.6v1.6c1.9.3 3 1.7 3 3.4 0 1.3-1 2.2-3 2.2Z" />
    </Base>
  );
}

export function IconFacebook(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M15.5 3.5h-2.6a4 4 0 0 0-4 4v2.7H6.2v3.6h2.7v6.7h3.7v-6.7h2.7l.7-3.6h-3.4V7.7a1 1 0 0 1 1-1h2.4V3.5Z" />
    </Base>
  );
}

export function IconUpload(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 15.5v-11M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 16.5v1.7A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8v-1.7" />
    </Base>
  );
}

export function IconPlayCircle(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.6v6.8c0 .6.65.97 1.16.66l5-3.4a.78.78 0 0 0 0-1.32l-5-3.4A.78.78 0 0 0 10 8.6Z" />
    </Base>
  );
}

export function IconZoomIn(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8M11 8.2v5.6M8.2 11h5.6" />
    </Base>
  );
}

export function IconZoomOut(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8M8.2 11h5.6" />
    </Base>
  );
}

export function IconExpand(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5V9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15M15 20h3.5a1.5 1.5 0 0 0 1.5-1.5V15" />
      <path d="M4 4l5.5 5.5M20 4l-5.5 5.5M4 20l5.5-5.5M20 20l-5.5-5.5" />
    </Base>
  );
}

export function IconCompress(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 9h3.5A1.5 1.5 0 0 0 9 7.5V4M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20M20 15h-3.5a1.5 1.5 0 0 0-1.5 1.5V20" />
      <path d="M9.5 9.5 4 4M14.5 9.5 20 4M9.5 14.5 4 20M14.5 14.5 20 20" />
    </Base>
  );
}

export function IconFitPage(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="6" y="3.5" width="12" height="17" rx="2" />
      <path d="M9.5 7.5h5M9.5 11h5M9.5 14.5h3" />
    </Base>
  );
}

export function IconFitWidth(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M6.5 12h11M8.8 9.8 6.5 12l2.3 2.2M15.2 9.8l2.3 2.2-2.3 2.2" />
    </Base>
  );
}

export function IconBrightness(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.2M12 19v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.8 12H5M19 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      <path d="M12 8a4 4 0 0 1 0 8Z" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconGridDots(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="4" y="4" width="4.5" height="4.5" rx="1.4" />
      <rect x="9.75" y="4" width="4.5" height="4.5" rx="1.4" />
      <rect x="15.5" y="4" width="4.5" height="4.5" rx="1.4" />
      <rect x="4" y="9.75" width="4.5" height="4.5" rx="1.4" />
      <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1.4" />
      <rect x="15.5" y="9.75" width="4.5" height="4.5" rx="1.4" />
      <rect x="4" y="15.5" width="4.5" height="4.5" rx="1.4" />
      <rect x="9.75" y="15.5" width="4.5" height="4.5" rx="1.4" />
      <rect x="15.5" y="15.5" width="4.5" height="4.5" rx="1.4" />
    </Base>
  );
}

export function IconBookmarkFill(p: IconProps) {
  return (
    <svg
      width={p.size ?? 20}
      height={p.size ?? 20}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={p.strokeWidth ?? 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={p.className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 3.5h11V21L12 16.8 6.5 21V3.5Z" />
    </svg>
  );
}

export function IconIdCard(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="8.6" cy="10.8" r="1.9" />
      <path d="M5.9 16.4a2.9 2.9 0 0 1 5.4 0M14.5 9.8h4M14.5 13h4" />
    </Base>
  );
}
