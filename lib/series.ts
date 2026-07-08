/**
 * 상세 그래프용 시계열 생성.
 *
 * 최근값(current)까지 완만히 수렴하는 추세를, 위험 케이스는 뒤쪽에서 급하게
 * 꺾이도록(ease 지수 ↑) 만든다. 시드 기반이라 같은 (환자·항목·기간)이면
 * 항상 같은 그래프가 나온다.
 */

import { hash, mulberry32 } from "./rng";
import type { Period } from "./types";

const AMP: Record<string, number> = { temp: 0.28, sbp: 6, dbp: 5, hr: 6, rr: 1.6, spo2: 1.4 };

/** 기간별 표본 개수. */
function sampleCount(period: Period): number {
  return period === "24h" ? 48 : period === "7d" ? 84 : 60;
}

export function genSeries(
  pid: string,
  key: string,
  base: number,
  current: number,
  danger: boolean,
  period: Period,
): number[] {
  const n = sampleCount(period);
  const rng = mulberry32(hash(`${pid}|${key}|${period}`));
  const amp = AMP[key] ?? 1;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const ease = Math.pow(t, danger ? 3.2 : 1.4);
    const center = base + (current - base) * ease;
    const val = center + (rng() - 0.5) * amp * 2 * (1 - 0.4 * ease);
    out.push(val);
  }
  out[n - 1] = current; // 마지막 점은 실제 최근값에 고정
  return out;
}

/** X축 시작 라벨. */
export function axisStart(period: Period): string {
  return period === "24h" ? "-24h" : period === "7d" ? "-7d" : "-30d";
}

/** 기간 한글 라벨. */
export function periodLabel(period: Period): string {
  return period === "24h" ? "최근 24시간" : period === "7d" ? "최근 7일" : "최근 30일";
}
