import Link from "next/link";
import { Lock, MessageCircle, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AmbientBackground } from "@/components/motion/ambient-background";
import { BrandLockup } from "@/components/site/brand-lockup";
import { headerBar, shellWidth } from "@/components/site/shell";
import { ThemeToggle } from "@/components/site/theme-toggle";

const highlights = [
  {
    title: "Private library",
    body: "Upload files that only you can see, then share them when you are ready.",
    icon: Lock,
  },
  {
    title: "Teams",
    body: "Create a team, add colleagues, and keep the right files in one place.",
    icon: Users,
  },
  {
    title: "Ask your files",
    body: "Chat with a team’s documents and get an answer you can check.",
    icon: MessageCircle,
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <AmbientBackground variant="soft" />
      <header className="relative z-10 sticky top-0 border-b border-border/80 bg-card/85 backdrop-blur">
        <div className={headerBar}>
          <BrandLockup href="/" />
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Home
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              Get started
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <div className={`relative z-10 flex flex-1 items-center py-10 ${shellWidth}`}>
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:gap-16">
          <aside className="hidden lg:block">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Folio</p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight">
              Your team’s knowledge, without the folder hunt.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Keep a private library, share files with teams you belong to, and ask questions in
              everyday language.
            </p>
            <ul className="mt-10 grid gap-4">
              {highlights.map((item) => (
                <li key={item.title} className="flex gap-4 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
          <main className="animate-fade-up w-full rounded-2xl border border-border/80 bg-card/90 p-8 shadow-sm backdrop-blur-sm sm:p-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
