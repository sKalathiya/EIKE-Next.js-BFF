"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, MessageCircle, Users } from "lucide-react";
import { ensureAvatarSeed } from "@/lib/profile-avatar";
import { useUserStore } from "@/lib/stores/user-store";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { BrandLockup } from "@/components/site/brand-lockup";
import { headerBar } from "@/components/site/shell";
import { ThemeToggle } from "@/components/site/theme-toggle";

function navLinkClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:gap-2 sm:px-3 md:px-3.5 ${
    active
      ? "bg-background font-medium text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
  }`;
}

export function AppHeader() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);
  const [seed, setSeed] = useState<string | null>(null);
  const onLibrary = pathname === "/documents" || pathname.startsWith("/documents/");
  const onTeams = pathname === "/teams" || pathname.startsWith("/teams/");
  const onChat = pathname === "/chat" || pathname.startsWith("/chat/");
  const onProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  const firstName = user?.firstName?.trim() || null;

  useEffect(() => {
    setSeed(ensureAvatarSeed());
    void loadUser();
  }, [loadUser]);

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/85 backdrop-blur">
      <div className={headerBar}>
        <div className="flex min-w-0 shrink-0 items-center">
          <BrandLockup href="/documents" />
        </div>

        <nav
          aria-label="Pages"
          className="ml-3 flex shrink-0 items-center gap-0.5 rounded-full border border-border/70 bg-muted/45 p-1 sm:ml-5 lg:absolute lg:left-1/2 lg:ml-0 lg:-translate-x-1/2"
        >
          <Link href="/documents" aria-current={onLibrary ? "page" : undefined} aria-label="Library" className={navLinkClass(onLibrary)}>
            <FolderOpen className="size-4" />
            <span className="hidden md:inline">Library</span>
          </Link>
          <Link href="/teams" aria-current={onTeams ? "page" : undefined} aria-label="Teams" className={navLinkClass(onTeams)}>
            <Users className="size-4" />
            <span className="hidden md:inline">Teams</span>
          </Link>
          <Link href="/chat" aria-current={onChat ? "page" : undefined} aria-label="Chat" className={navLinkClass(onChat)}>
            <MessageCircle className="size-4" />
            <span className="hidden md:inline">Chat</span>
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2 sm:gap-3 sm:pl-4">
          <Link
            href="/profile"
            title="Your profile"
            aria-label="Open your profile"
            aria-current={onProfile ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:pr-3.5 ${
              onProfile ? "bg-accent text-primary" : "text-foreground hover:bg-accent/80"
            }`}
          >
            {seed ? (
              <ProfileAvatar seed={seed} size={32} />
            ) : (
              <span className="block size-8 rounded-full bg-muted" />
            )}
            <span className="hidden pr-0.5 text-sm font-medium md:inline">{firstName ?? "Profile"}</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
