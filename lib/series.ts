/** 상세 그래프 축·기간 라벨. (시계열 데이터는 Supabase 실측 v_vital_history 사용) */

import type { Period } from "./types";

/** X축 시작 라벨. */
export function axisStart(period: Period): string {
  return period === "24h" ? "-24h" : period === "7d" ? "-7d" : "-30d";
}

/** 기간 한글 라벨. */
export function periodLabel(period: Period): string {
  return period === "24h" ? "최근 24시간" : period === "7d" ? "최근 7일" : "최근 30일";
}
