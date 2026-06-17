import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getSupabasePublicEnv();

  browserClient ??= createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}

