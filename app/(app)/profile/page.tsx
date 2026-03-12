"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoNotifications, demoProfile } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [profile, setProfile] = useState(demoProfile);
  const [notifications, setNotifications] = useState(demoNotifications);
  const [password, setPassword] = useState("");
  const [prefs, setPrefs] = useState({ in_app_enabled: true, email_enabled: true, push_enabled: false });

  const hydrate = async () => {
    if (!hasSupabaseEnv) return;
    const supabase = createClient();
    const [{ data: profileData }, { data: notificationData }, { data: prefData }] = await Promise.all([
      supabase.from("profiles").select("*").single(),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("notification_preferences").select("*").single()
    ]);

    if (profileData) setProfile(profileData as typeof demoProfile);
    if (notificationData) setNotifications(notificationData as typeof demoNotifications);
    if (prefData) setPrefs(prefData);
  };

  useEffect(() => {
    void hydrate();
  }, []);

  const saveProfile = async () => {
    if (!hasSupabaseEnv) {
      toast.success("Profile updated in demo mode");
      return;
    }

    const supabase = createClient();
    const { error: profileError } = await supabase.from("profiles").upsert(profile);
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url
      },
      ...(password ? { password } : {})
    });

    if (profileError || authError) {
      toast.error(profileError?.message ?? authError?.message ?? "Failed to save profile");
      return;
    }

    toast.success("Profile updated");
    setPassword("");
  };

  const savePreferences = async () => {
    if (!hasSupabaseEnv) {
      toast.success("Preferences updated in demo mode");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("notification_preferences").upsert(prefs);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Notification preferences saved");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground">Profile, password, notifications and identity settings.</p>
        <h1 className="text-3xl font-semibold">Profile</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Edit visible name, username, avatar and bio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
                <AvatarFallback>{profile.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">Use any public image URL or Google avatar.</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input id="profile-name" value={profile.display_name} onChange={(event) => setProfile((current) => ({ ...current, display_name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input id="profile-username" value={profile.username} onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-avatar">Avatar URL</Label>
              <Input id="profile-avatar" value={profile.avatar_url ?? ""} onChange={(event) => setProfile((current) => ({ ...current, avatar_url: event.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea id="profile-bio" value={profile.bio ?? ""} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">New password</Label>
              <Input id="profile-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep current password" />
            </div>
            <Button type="button" onClick={() => void saveProfile()}>Save profile</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card id="notifications">
            <CardHeader>
              <CardTitle>Notification settings</CardTitle>
              <CardDescription>Choose where reminders should appear.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["In-app notifications", "in_app_enabled"],
                ["Email alerts", "email_enabled"],
                ["Push notifications", "push_enabled"]
              ].map(([label, key]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[key as keyof typeof prefs]}
                    onChange={(event) => setPrefs((current) => ({ ...current, [key]: event.target.checked }))}
                    className="h-4 w-4"
                  />
                </label>
              ))}
              <Button type="button" variant="outline" onClick={() => void savePreferences()}>Save preferences</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent notifications</CardTitle>
              <CardDescription>Latest alerts from the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
