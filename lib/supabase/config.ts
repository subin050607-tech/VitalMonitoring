/**
 * Supabase 연결 설정. 환경변수가 둘 다 있으면 라이브 모드로 켜진다.
 * (없으면 앱은 내장 시뮬레이션으로 폴백한다.)
 *
 *   NEXT_PUBLIC_SUPABASE_URL       = https://<project-ref>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  = publishable/anon 키 (클라이언트 공개용)
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true 면 웹이 실제 Supabase 뷰를 읽는다. */
export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
