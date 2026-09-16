"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { logout } from "@/lib/api";
import { useUserStore } from "@/lib/stores/user-store";

type LogoutButtonProps = {
  className?: string;
  variant?: "ghost" | "outline";
};

export function LogoutButton({ className, variant = "ghost" }: LogoutButtonProps) {
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await logout();
    } finally {
      clearUser();
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={() => void onClick()}
    >
      {pending ? <Spinner label="Signing out" /> : <LogOut />}
      Sign out
    </Button>
  );
}
