import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { menuUser, type MenuUser } from "./nav";

/** The signed-in student for the profile menu, or null when signed out (or Supabase isn't set up). */
export async function getMenuUser(): Promise<MenuUser | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
  return menuUser(profile?.full_name, profile?.email ?? user.email);
}
