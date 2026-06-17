import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getSupabasePublicEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, options, value }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot mutate cookies during render.
          }
        },
      },
    },
  );
}

