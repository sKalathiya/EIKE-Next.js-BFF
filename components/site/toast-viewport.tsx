"use client";

import { useEffect } from "react";
import { Check, Info, X } from "lucide-react";
import { useToastStore, type ToastKind } from "@/lib/stores/toast-store";

const KIND_CLASS: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-card text-foreground dark:border-emerald-900",
  error: "border-destructive/25 bg-card text-foreground",
  info: "border-border/80 bg-card text-foreground",
};

const ICON_CLASS: Record<ToastKind, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  error: "bg-destructive/10 text-destructive",
  info: "bg-accent text-primary",
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  const Icon = kind === "error" ? X : kind === "success" ? Check : Info;
  return (
    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${ICON_CLASS[kind]}`}>
      <Icon className="size-4" />
    </span>
  );
}

function ToastCard({
  id,
  kind,
  title,
  description,
}: {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(id), 5200);
    return () => window.clearTimeout(timer);
  }, [dismiss, id]);

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`animate-toast-in pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border px-3.5 py-3 shadow-lg ${KIND_CLASS[kind]}`}
    >
      <ToastIcon kind={kind} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(id)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} {...toast} />
      ))}
    </div>
  );
}
