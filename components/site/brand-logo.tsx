type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "size-8" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M8.5 10.2c3.2 1.15 4.8 1.15 7.5 0v12.1c-2.7 1.2-4.3 1.2-7.5 0V10.2Z"
        className="fill-primary-foreground"
        opacity="0.96"
      />
      <path
        d="M16 10.2c2.7 1.15 4.3 1.15 7.5 0v12.1c-3.2 1.2-4.8 1.2-7.5 0V10.2Z"
        className="fill-primary-foreground"
        opacity="0.72"
      />
      <path
        d="M16 10.4v11.6"
        className="stroke-primary"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M24.2 7.1 25 8.8l1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z"
        className="logo-spark fill-primary-foreground"
      />
    </svg>
  );
}
