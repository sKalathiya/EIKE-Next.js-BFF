import { create } from "zustand";
import { getUser } from "@/lib/api";
import { humanizeError } from "@/lib/human-error";

export type AppUser = {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UserStatus = "idle" | "loading" | "ready" | "error";
export type LoadUserResult = "ready" | "unauthorized" | "error";

type UserState = {
  user: AppUser | null;
  status: UserStatus;
  error: string | null;
  loadUser: (options?: { force?: boolean }) => Promise<LoadUserResult>;
  setUser: (user: AppUser) => void;
  clearUser: () => void;
};

function isAppUser(value: unknown): value is AppUser {
  return Boolean(value && typeof value === "object" && "email" in value && typeof (value as AppUser).email === "string");
}

let inFlight: Promise<LoadUserResult> | null = null;

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,

  loadUser: (options) => {
    if (!options?.force && get().status === "ready" && get().user) {
      return Promise.resolve<LoadUserResult>("ready");
    }
    if (inFlight && !options?.force) return inFlight;

    inFlight = (async () => {
      const keepVisible = Boolean(options?.force && get().user);
      if (!keepVisible) set({ status: "loading", error: null });
      try {
        const response = await getUser();
        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          set({ user: null, status: "error", error: "unauthorized" });
          return "unauthorized";
        }

        if (!response.ok || !isAppUser(payload)) {
          set({ status: "error", error: humanizeError(payload, "Could not load your profile.") });
          return "error";
        }

        set({ user: payload, status: "ready", error: null });
        return "ready";
      } catch {
        set({ status: "error", error: "Could not load your profile. Try again." });
        return "error";
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  setUser: (user) => {
    set({ user, status: "ready", error: null });
  },

  clearUser: () => {
    inFlight = null;
    set({ user: null, status: "idle", error: null });
  },
}));
