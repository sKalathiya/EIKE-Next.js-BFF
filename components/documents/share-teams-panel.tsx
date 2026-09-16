"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, File, FileText, Share2, UserMinus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type ShareTeamOption = { id: string; name: string };

type ShareTeamsDialogProps = {
  open: boolean;
  fileName: string;
  shareTeams: ShareTeamOption[];
  unshareTeams: ShareTeamOption[];
  currentTeamId?: string | null;
  pending: boolean;
  onClose: () => void;
  onShare: (teamIds: string[]) => Promise<void>;
  onUnshare: (teamIds: string[]) => Promise<void>;
};

function FileGlyph({ fileName }: { fileName: string }) {
  const pdf = fileName.toLowerCase().endsWith(".pdf");
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
        pdf
          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
          : "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200"
      }`}
    >
      {pdf ? <FileText className="size-4" /> : <File className="size-4" />}
    </span>
  );
}

function TeamPills({
  teams,
  selected,
  disabled,
  currentTeamId,
  tone,
  onToggle,
}: {
  teams: ShareTeamOption[];
  selected: Set<string>;
  disabled: boolean;
  currentTeamId?: string | null;
  tone: "add" | "remove";
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {teams.map((team) => {
        const checked = selected.has(team.id);
        const current = team.id === currentTeamId;
        return (
          <li key={team.id}>
            <button
              type="button"
              disabled={disabled}
              aria-pressed={checked}
              onClick={() => onToggle(team.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                checked
                  ? tone === "remove"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-primary/30 bg-accent text-primary"
                  : "border-border/80 bg-background text-foreground hover:border-foreground/25 hover:bg-muted/60"
              }`}
            >
              {checked ? <Check className="size-3.5 shrink-0" /> : null}
              <span className="max-w-40 truncate">{team.name}</span>
              {current ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                  This team
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ShareTeamsDialog({
  open,
  fileName,
  shareTeams,
  unshareTeams,
  currentTeamId,
  pending,
  onClose,
  onShare,
  onUnshare,
}: ShareTeamsDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [shareIds, setShareIds] = useState<Set<string>>(new Set());
  const [unshareIds, setUnshareIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setShareIds(new Set());
    setUnshareIds(new Set());
  }, [open, fileName]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, pending, onClose]);

  if (!open || !mounted) return null;

  function toggle(kind: "share" | "unshare", id: string) {
    const update = kind === "share" ? setShareIds : setUnshareIds;
    update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitShare() {
    const ids = [...shareIds];
    if (ids.length === 0 || pending) return;
    await onShare(ids);
    setShareIds(new Set());
  }

  async function submitUnshare() {
    const ids = [...unshareIds];
    if (ids.length === 0 || pending) return;
    await onUnshare(ids);
    setUnshareIds(new Set());
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="animate-fade-in absolute inset-0 bg-zinc-950/55 dark:bg-black/70"
        aria-label="Close share dialog"
        disabled={pending}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="animate-fade-up relative z-10 flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl"
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 sm:px-6">
          <FileGlyph fileName={fileName} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">Sharing</p>
            <h2 id="share-dialog-title" className="mt-0.5 truncate text-lg font-semibold tracking-tight">
              {fileName}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Add this file to teams, or take it back.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full"
            disabled={pending}
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-2 sm:px-6">
          <section className="rounded-2xl bg-muted/45 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-primary">
                <Share2 className="size-3.5" />
              </span>
              <div>
                <h3 className="text-sm font-medium">Add to teams</h3>
                <p className="text-xs text-muted-foreground">Select every team that should see this file.</p>
              </div>
            </div>
            {shareTeams.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">No other teams can receive this file.</p>
            ) : (
              <TeamPills
                teams={shareTeams}
                selected={shareIds}
                disabled={pending}
                tone="add"
                onToggle={(id) => toggle("share", id)}
              />
            )}
          </section>

          <section className="rounded-2xl bg-muted/45 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <UserMinus className="size-3.5" />
              </span>
              <div>
                <h3 className="text-sm font-medium">Remove from teams</h3>
                <p className="text-xs text-muted-foreground">Last team removed sends it back to Private.</p>
              </div>
            </div>
            {unshareTeams.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">This file is not on any other team.</p>
            ) : (
              <TeamPills
                teams={unshareTeams}
                selected={unshareIds}
                disabled={pending}
                currentTeamId={currentTeamId}
                tone="remove"
                onToggle={(id) => toggle("unshare", id)}
              />
            )}
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-background/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button type="button" variant="ghost" className="h-9" disabled={pending} onClick={onClose}>
            Done
          </Button>
          {unshareTeams.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={pending || unshareIds.size === 0}
              aria-busy={pending && unshareIds.size > 0}
              onClick={() => void submitUnshare()}
            >
              {pending && unshareIds.size > 0 ? <Spinner label="Removing from teams" /> : null}
              {unshareIds.size === 0 ? "Remove" : `Remove from ${unshareIds.size}`}
            </Button>
          ) : null}
          {shareTeams.length > 0 ? (
            <Button
              type="button"
              className="h-9 px-4"
              disabled={pending || shareIds.size === 0}
              aria-busy={pending && shareIds.size > 0}
              onClick={() => void submitShare()}
            >
              {pending && shareIds.size > 0 ? <Spinner label="Sharing with teams" /> : null}
              {shareIds.size === 0 ? "Share" : `Share with ${shareIds.size}`}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
