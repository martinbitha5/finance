import { useId } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/**
 * MONY brand mark: the letter M drawn as a rising trend line ending in an arrow.
 * Source of truth for the static assets lives in scripts/generate-icons.mjs — keep the path in sync.
 */
const MARK_PATH = "M126 368 V200 L242 304 L386 146 M314 146 H386 V218";

type MarkProps = {
  /** Rendered width/height in px (square). */
  size?: number;
  className?: string;
};

/** The app-icon tile: rounded dark square with aurora glow and the gradient mark. */
export function LogoMark({ size = 40, className }: MarkProps) {
  const id = useId();
  const ink = `${id}-ink`;
  const glow = `${id}-glow`;
  const aurora = `${id}-aurora`;
  const clip = `${id}-clip`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label={APP_NAME}
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={ink} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#182234" />
          <stop offset="1" stopColor="#0b1220" />
        </linearGradient>
        <radialGradient id={glow} cx="1" cy="0" r="0.95">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.42" />
          <stop offset="0.6" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={aurora} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#a3e635" />
        </linearGradient>
        <clipPath id={clip}>
          <rect width="512" height="512" rx="118" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="512" height="512" fill={`url(#${ink})`} />
        <rect width="512" height="512" fill={`url(#${glow})`} />
      </g>
      <path
        d={MARK_PATH}
        fill="none"
        stroke={`url(#${aurora})`}
        strokeWidth="56"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The bare mark with no tile. Uses the aurora gradient by default; pass `tone="current"`
 * to draw it in `currentColor` (monochrome, e.g. inside buttons or on the aurora surface).
 */
export function LogoGlyph({ size = 24, className, tone = "aurora" }: MarkProps & { tone?: "aurora" | "current" }) {
  const id = useId();
  const aurora = `${id}-aurora`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="88 108 336 296"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {tone === "aurora" && (
        <defs>
          <linearGradient id={aurora} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#a3e635" />
          </linearGradient>
        </defs>
      )}
      <path
        d={MARK_PATH}
        fill="none"
        stroke={tone === "aurora" ? `url(#${aurora})` : "currentColor"}
        strokeWidth="56"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Horizontal lockup: tile + wordmark. Inherits text color from its parent. */
export function Logo({
  size = 40,
  className,
  wordmarkClassName,
}: MarkProps & { wordmarkClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <span className={cn("font-extrabold tracking-tight leading-none", wordmarkClassName)}>{APP_NAME}</span>
    </span>
  );
}
