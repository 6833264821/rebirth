"use client";

import { Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled
      aria-label="Dark mode enabled"
      title="Dark mode enabled"
    >
      <Moon className="h-4 w-4" />
    </Button>
  );
}
