"use client";

import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    identifier: "",
    password: "",
    displayName: ""
  });

  const heading = useMemo(
    () =>
      mode === "login"
        ? { title: "Welcome back", description: "Sign in with Google or your username/email and password." }
        : { title: "Create your system", description: "Set a display name, username and password to start tracking." },
    [mode]
  );

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resolveEmail = async () => {
    if (form.identifier.includes("@")) {
      return form.identifier;
    }

    const response = await fetch("/api/auth/resolve-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.identifier })
    });

    if (!response.ok) {
      throw new Error("Username not found");
    }

    const payload = (await response.json()) as { email: string };
    return payload.email;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasSupabaseEnv) {
      toast.info("Connect Supabase keys in .env.local to enable authentication.");
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const email = await resolveEmail();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: form.password
        });

        if (error) {
          throw error;
        }

        toast.success("Signed in");
        router.push("/dashboard");
        router.refresh();
      } else {
        const email = form.identifier.includes("@") ? form.identifier : `${form.username}@rebirth.local`;
        const { error } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              display_name: form.displayName || form.username,
              username: form.username
            }
          }
        });

        if (error) {
          throw error;
        }

        toast.success("Account created. Check your email if confirmation is enabled.");
        setMode("login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!hasSupabaseEnv) {
      toast.info("Google OAuth requires Supabase environment variables.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events profile email"
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Rebirth 2.0</p>
        <h1 className="text-3xl font-semibold">{heading.title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{heading.description}</p>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue with Google
      </Button>

      <div className="relative text-center text-xs uppercase tracking-[0.28em] text-muted-foreground">
        <span className="bg-card px-3">or</span>
        <div className="absolute left-0 top-1/2 -z-10 h-px w-full -translate-y-1/2 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} placeholder="Analog" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} placeholder="analogit" required />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="identifier">{mode === "login" ? "Email / Username" : "Email"}</Label>
          <Input
            id="identifier"
            value={form.identifier}
            onChange={(event) => updateField("identifier", event.target.value)}
            placeholder={mode === "login" ? "you@example.com or analogit" : "you@example.com"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="••••••••" required />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        className="text-sm text-muted-foreground transition hover:text-foreground"
        onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
      >
        {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
