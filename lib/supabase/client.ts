import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_ENABLED, SUPABASE_URL } from "./config";

/**
 * 브라우저용 Supabase 클라이언트 싱글턴.
 * 라이브 모드가 아니면 null — import 하는 쪽에서 SUPABASE_ENABLED 로 가드한다.
 */
export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;
