import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!url || !serviceRole) {
    return NextResponse.json({ message: "Username resolution unavailable" }, { status: 503 });
  }

  const { username } = (await request.json()) as { username?: string };

  if (!username) {
    return NextResponse.json({ message: "Username is required" }, { status: 400 });
  }

  const adminClient = createClient(url, serviceRole);
  const { data, error } = await adminClient
    .from("profiles")
    .select("email")
    .eq("username", username)
    .maybeSingle();

  if (error || !data?.email) {
    return NextResponse.json({ message: "Username not found" }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}
