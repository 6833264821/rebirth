import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";

export default function HomePage() {
  redirect(hasSupabaseEnv ? "/login" : "/dashboard");
}
