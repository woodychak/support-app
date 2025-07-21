// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 必須是 Service Role Key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export default supabaseAdmin;
