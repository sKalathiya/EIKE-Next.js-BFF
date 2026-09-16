import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandLockup } from "@/components/site/brand-lockup";
import { headerBar } from "@/components/site/shell";
import { ThemeToggle } from "@/components/site/theme-toggle";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className={headerBar}>
        <div className="flex min-w-0 shrink-0 items-center">
          <BrandLockup href="/" />
        </div>
        <nav
          aria-label="Site"
          className="ml-auto hidden items-center gap-1 lg:flex lg:absolute lg:left-1/2 lg:ml-0 lg:-translate-x-1/2"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-4 sm:gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            Get started
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
