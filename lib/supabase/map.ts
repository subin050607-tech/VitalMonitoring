/** Supabase 뷰 행 → 웹 도메인 모델 매핑. */

import type { AlertRecord } from "../alerts";
import type { Patient, RangesConfig, VitalSeries, Vitals } from "../types";
import { patientStatus } from "../vitals";
import type { AlarmListRow, PatientSearchRow, VitalHistoryRow } from "./rows";

const num = (s: string | null | undefined): number => {
  const v = parseFloat(String(s ?? ""));
  return Number.isFinite(v) ? v : 0;
};

/** "120/80" → [수축기, 이완기]. */
function parseBp(bp: string | null): [number, number] {
  if (!bp || !bp.includes("/")) return [0, 0];
  const [s, d] = bp.split("/");
  return [num(s), num(d)];
}

/** "5병동" → "5". */
export function wardOf(wadNam: string | null): string {
  const m = String(wadNam ?? "").match(/\d+/);
  return m ? m[0] : "";
}

const epoch = (ts: string | null): number => {
  const t = ts ? Date.parse(ts.replace(" ", "T")) : NaN;
  return Number.isFinite(t) ? t : Date.now();
};

/** 생년월일 문자열 → 만 나이(근사). */
function ageFrom(bthday: string | null): number {
  const y = parseInt(String(bthday ?? "").slice(0, 4), 10);
  if (!Number.isFinite(y)) return 0;
  return Math.max(0, new Date().getFullYear() - y);
}

/** "1970-01-01", "남" → "56세 · 남 M". */
function ageSex(bthday: string | null, gender: string | null): string {
  const g = gender === "남" ? "남 M" : gender === "여" ? "여 F" : String(gender ?? "");
  return `${ageFrom(bthday)}세 · ${g}`;
}

/** 바이탈 이력 행 → 숫자형 Vitals. */
export function toVitals(v: VitalHistoryRow): Vitals {
  const [sbp, dbp] = parseBp(v.blood_pressure);
  return {
    temp: num(v.temperature),
    sbp,
    dbp,
    hr: num(v.pulse),
    rr: num(v.respiration),
    spo2: num(v.spo2),
  };
}

/** 환자검색 행 + 최근 바이탈 → 웹 Patient. */
export function toPatient(
  p: PatientSearchRow,
  latest: VitalHistoryRow,
  ranges: RangesConfig,
  acknowledged: boolean,
): Patient {
  const v = toVitals(latest);
  const room = [p.wad_nam, p.rom_nam].filter(Boolean).join(" "); // "5병동 501호"
  return {
    id: String(p.pat_cht_num ?? ""),
    ward: wardOf(p.wad_nam),
    name: p.pat_nam ?? "",
    chartNo: `No.${p.pat_cht_num ?? ""}`,
    room,
    ageSex: ageSex(p.pat_bthday, p.pat_gender),
    v,
    status: patientStatus(ranges, v),
    measured: epoch(latest.record_time),
    acknowledged,
    ackBy: acknowledged ? "이정민" : "",
    ackAt: "",
  };
}

/** 바이탈 이력 행들(시간 오름차순) → 상세 그래프용 실측 시계열. */
export function toSeries(rows: VitalHistoryRow[]): VitalSeries {
  const s: VitalSeries = { times: [], temp: [], sbp: [], dbp: [], hr: [], rr: [], spo2: [] };
  for (const r of rows) {
    const [sbp, dbp] = parseBp(r.blood_pressure);
    s.times.push(epoch(r.record_time));
    s.temp.push(num(r.temperature));
    s.sbp.push(sbp);
    s.dbp.push(dbp);
    s.hr.push(num(r.pulse));
    s.rr.push(num(r.respiration));
    s.spo2.push(num(r.spo2));
  }
  return s;
}

/** epoch ms 를 외부에서도 쓰도록 노출 (ack 키 등). */
export function recordEpoch(ts: string | null): number {
  return epoch(ts);
}

/** 알림 목록 행 → 알림 이력 레코드. (서버에 확인 상태가 없어 미확인으로 둔다.) */
export function alarmToRecord(a: AlarmListRow): AlertRecord {
  const msg = a.alm_msg ?? "";
  const sp = msg.indexOf(" ");
  const item = sp > 0 ? msg.slice(0, sp) : msg;
  const value = sp > 0 ? msg.slice(sp + 1).split(" ")[0] : "";
  return {
    id: `al-${a.alm_id}`,
    time: epoch(a.create_dt),
    ward: wardOf(a.wad_nam),
    name: a.pat_nam ?? "",
    room: a.wad_nam ?? "",
    item,
    value,
    acked: false,
    ackBy: "",
    ackAt: "",
    ackAfterSec: 0,
  };
}
