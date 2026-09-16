"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  pendingLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  pendingLabel,
  danger = true,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, pending, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="animate-fade-in absolute inset-0 bg-zinc-950/55 dark:bg-black/70"
        aria-label="Cancel"
        disabled={pending}
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="animate-fade-up relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl"
      >
        <div className="px-5 pt-5 pb-2 sm:px-6">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="ghost" className="h-9" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger ? "destructive" : "default"}
            className="h-9"
            disabled={pending}
            aria-busy={pending}
            onClick={onConfirm}
          >
            {pending ? <Spinner label={pendingLabel ?? confirmLabel} /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
