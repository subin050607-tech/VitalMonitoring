/** 시각 포맷 유틸. 관제 화면 특성상 로케일 무관 24시간 표기로 고정한다. */

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** HH:MM:SS — LIVE 시계, 측정시각, 확인시각 표기. */
export function fmtClock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** HH:MM — 토스트 등 짧은 표기. */
export function fmtHM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
