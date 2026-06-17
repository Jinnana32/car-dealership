import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export default async function HomePage(): Promise<never> {
  if (!hasSupabasePublicEnv()) {
    redirect("/login");
  }

  const user = await getAuthenticatedUser();

  redirect(user ? "/admin/dashboard" : "/login");
}
