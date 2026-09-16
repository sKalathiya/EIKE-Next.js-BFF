import Link from "next/link";
import { BrandLogo } from "@/components/site/brand-logo";

type BrandLockupProps = {
  href: string;
};

export function BrandLockup({ href }: BrandLockupProps) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label="Folio home"
    >
      <BrandLogo className="size-8 shrink-0 transition-transform duration-300 group-hover:scale-105" />
      <span className="hidden leading-tight sm:block">
        <span className="block text-sm font-semibold tracking-tight text-foreground">Folio</span>
        <span className="hidden text-[11px] text-muted-foreground md:block">Your private library</span>
      </span>
    </Link>
  );
}
