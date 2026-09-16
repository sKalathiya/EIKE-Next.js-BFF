import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastState = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id: crypto.randomUUID() }],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

export const notify = {
  success(title: string, description?: string) {
    useToastStore.getState().push({ kind: "success", title, description });
  },
  error(title: string, description?: string) {
    useToastStore.getState().push({ kind: "error", title, description });
  },
  info(title: string, description?: string) {
    useToastStore.getState().push({ kind: "info", title, description });
  },
};
