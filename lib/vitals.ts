/**
 * 바이탈 위험 기준치 판정.
 *
 * 요구사항서 FR-02 의 임계치를 반영한다. 정상 범위 안이면 normal,
 * 정상은 벗어났지만 주의 범위 안이면 caution, 그 밖이면 danger.
 * 임계치는 설정 화면에서 편집 가능하도록 판정 함수가 ranges 를 인자로 받는다.
 * (요구사항서 3.13 유지 보수성 — 임계치 조정을 코드 수정 없이.)
 */

import { C } from "./theme";
import type { RangeKey, RangesConfig, Status, Vitals } from "./types";

/** 기본 위험 기준치. 설정에서 바꾸기 전까지의 출발값. */
export const DEFAULT_RANGES: RangesConfig = {
  temp: { normal: [36.0, 37.7], caution: [35.3, 38.4] },
  sbp: { normal: [100, 139], caution: [90, 159] },
  dbp: { normal: [60, 89], caution: [55, 99] },
  hr: { normal: [60, 99], caution: [50, 119] },
  rr: { normal: [12, 20], caution: [9, 24] },
  spo2: { normal: [95, 100], caution: [92, 100] },
};

/** 단일 바이탈 값의 상태를 판정한다. */
export function vStatus(ranges: RangesConfig, key: RangeKey, val: number): Status {
  const r = ranges[key];
  if (val >= r.normal[0] && val <= r.normal[1]) return "normal";
  if (val >= r.caution[0] && val <= r.caution[1]) return "caution";
  return "danger";
}

/** 혈압은 수축기·이완기 중 더 나쁜 쪽으로 상태를 잡는다. */
export function worstBp(ranges: RangesConfig, v: Vitals): Status {
  const a = vStatus(ranges, "sbp", v.sbp);
  const b = vStatus(ranges, "dbp", v.dbp);
  if (a === "danger" || b === "danger") return "danger";
  if (a === "caution" || b === "caution") return "caution";
  return "normal";
}

/** 환자의 종합 상태 — 6개 바이탈 중 가장 심각한 것을 대표값으로. */
export function patientStatus(ranges: RangesConfig, v: Vitals): Status {
  const st: Status[] = [
    vStatus(ranges, "temp", v.temp),
    vStatus(ranges, "sbp", v.sbp),
    vStatus(ranges, "dbp", v.dbp),
    vStatus(ranges, "hr", v.hr),
    vStatus(ranges, "rr", v.rr),
    vStatus(ranges, "spo2", v.spo2),
  ];
  if (st.includes("danger")) return "danger";
  if (st.includes("caution")) return "caution";
  return "normal";
}

/** 상태별 대표 텍스트 컬러. */
export function statusColor(st: Status): string {
  if (st === "danger") return C.dangerText;
  if (st === "caution") return C.cautionText;
  return C.ink700;
}
