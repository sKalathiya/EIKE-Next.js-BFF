"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Lock, Users } from "lucide-react";
import { cn } from "cn";
import { Spinner } from "@/components/ui/spinner";

export type ChatTeam = {
  id: string;
  name: string;
  isPrivate: boolean;
};

type TeamContextSelectProps = {
  teams: ChatTeam[];
  value: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (teamId: string) => void;
};

type MenuBox = {
  left: number;
  bottom: number;
  width: number;
  maxHeight: number;
};

export function TeamContextSelect({ teams, value, disabled, loading, onChange }: TeamContextSelectProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<MenuBox | null>(null);
  const selected = teams.find((team) => team.id === value) ?? teams[0] ?? null;

  function placeMenu() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    const spaceAbove = Math.max(0, rect.top - 16);
    const maxHeight = Math.min(240, Math.max(148, spaceAbove));
    setBox({
      left,
      bottom: window.innerHeight - rect.top + 12,
      width,
      maxHeight,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open, teams.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onReposition() {
      placeMenu();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  function choose(teamId: string) {
    onChange(teamId);
    setOpen(false);
  }

  const menu =
    open && box
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label="Teams"
            style={{ left: box.left, bottom: box.bottom, width: box.width, maxHeight: box.maxHeight }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-popover p-2 shadow-xl ring-1 ring-foreground/5"
          >
            <p className="shrink-0 px-3 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Search in
            </p>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5 scrollbar-thin">
              {teams.map((team) => {
                const active = team.id === selected?.id;
                return (
                  <li key={team.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => choose(team.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        active
                          ? "bg-accent font-medium text-primary"
                          : "text-foreground hover:bg-muted/80",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          team.isPrivate ? "bg-muted text-muted-foreground" : "bg-accent/80 text-primary",
                        )}
                      >
                        {team.isPrivate ? <Lock className="size-3.5" /> : <Users className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{team.name}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                          {team.isPrivate ? "Only your private files" : "Files shared with this team"}
                        </span>
                      </span>
                      {active ? <Check className="size-4 shrink-0 text-primary" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading || teams.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Team to search"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "group inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-muted/60 py-1.5 pr-3 pl-1.5 text-left shadow-sm transition-all outline-none",
          "hover:border-foreground/20 hover:bg-background hover:shadow",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-foreground/20 bg-background shadow",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full",
            selected?.isPrivate ? "bg-background text-muted-foreground" : "bg-accent text-primary",
          )}
        >
          {loading ? (
            <Spinner size="sm" label="Loading teams" />
          ) : selected?.isPrivate ? (
            <Lock className="size-3" />
          ) : (
            <Users className="size-3" />
          )}
        </span>
        <span className="min-w-0 truncate text-xs font-medium sm:text-sm">
          {loading ? "Teams" : selected?.name ?? "Choose a team"}
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {menu}
    </div>
  );
}
