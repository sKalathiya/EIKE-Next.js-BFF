import { cn } from "cn";

const SIZE = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: keyof typeof SIZE;
};

export function Spinner({ className, label = "Working", size = "md" }: SpinnerProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0", SIZE[size], className)}
      role="status"
      aria-label={label}
    >
      <svg viewBox="0 0 20 20" className="size-full" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2.25" />
      </svg>
      <svg viewBox="0 0 20 20" className="absolute inset-0 size-full animate-spin" fill="none" aria-hidden="true">
        <path
          d="M17.25 10a7.25 7.25 0 0 0-7.25-7.25"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
