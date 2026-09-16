"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fieldClassName } from "@/components/auth/fields";
import { register } from "@/lib/api";
import { notify } from "@/lib/stores/toast-store";
import { humanizeError } from "@/lib/human-error";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await register(firstName, lastName, email, password);
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = humanizeError(data, "Could not create your account. Check the form and try again.");
        setError(message);
        notify.error("Registration failed", message);
        return;
      }

      notify.success("Account created", "Sign in to start adding files.");
      router.push("/login");
      router.refresh();
    } catch {
      const message = "Could not create your account. Try again.";
      setError(message);
      notify.error("Registration failed", message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <p className="animate-fade-up text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Join Folio
      </p>
      <h1 className="animate-fade-up animate-delay-1 mt-2 text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="animate-fade-up animate-delay-2 mt-2 text-sm leading-6 text-muted-foreground">
        Create your account, then sign in to start adding files.
      </p>

      <form className="animate-fade-up animate-delay-3 mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            First name
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              maxLength={255}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Last name
            <input
              type="text"
              name="lastName"
              autoComplete="family-name"
              maxLength={255}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={fieldClassName}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={255}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+"
            title="At least 8 characters, with one uppercase letter, one lowercase letter, and one number"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <p className="-mt-2 text-xs text-muted-foreground">
          At least 8 characters, including uppercase, lowercase, and a number.
        </p>

        {error ? (
          <div className="animate-shake rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="mt-1 h-10 w-full" disabled={pending} aria-busy={pending}>
          {pending ? <Spinner label="Creating account" /> : null}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
