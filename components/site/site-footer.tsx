import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { BrandLogo } from "@/components/site/brand-logo";
import { shellWidth } from "@/components/site/shell";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-card">
      <Reveal className={`grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 ${shellWidth}`}>
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="size-8" />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Folio</p>
              <p className="text-[11px] text-muted-foreground">Your private library</p>
            </div>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Keep documents close, share them with the right team, and ask questions without
            searching through folders.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/#features" className="transition-colors hover:text-primary">
                Features
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="transition-colors hover:text-primary">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/#about" className="transition-colors hover:text-primary">
                About
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-primary">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="transition-colors hover:text-primary">
                Get started
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="mailto:hello@eike.app" className="transition-colors hover:text-primary">
                hello@eike.app
              </a>
            </li>
          </ul>
        </div>
      </Reveal>
      <div className="border-t border-border/80">
        <div className={`flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between ${shellWidth}`}>
          <p suppressHydrationWarning>© {new Date().getFullYear()} Folio. All rights reserved.</p>
          <p>Private by default. Shared only with the teams you choose.</p>
        </div>
      </div>
    </footer>
  );
}
