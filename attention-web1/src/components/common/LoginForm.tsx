"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_COOKIE, DEMO_CREDENTIALS, isValidCredentials } from "@/lib/auth";
import { appName, appTagline } from "@/lib/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidCredentials(email, password)) {
      setError("Invalid credentials. Use the demo account shown below.");
      return;
    }

    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-lg shadow-blue-900/20">
            <Brain className="size-7" />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
            {appName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{appTagline}</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-[#EF4444]">{error}</p>
            ) : null}

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Demo credentials</p>
            <p className="mt-2">{DEMO_CREDENTIALS.email}</p>
            <p>{DEMO_CREDENTIALS.password}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
