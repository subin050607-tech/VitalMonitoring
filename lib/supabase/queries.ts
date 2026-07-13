/** Supabase 뷰 조회 + Realtime 구독. supabase 가 null(비활성)이면 빈 결과. */

import type { AlertRecord } from "../alerts";
import { sha256hex } from "../hash";
import type { LoginUser, Patient, RangesConfig } from "../types";
import { supabase } from "./client";
import { alarmToRecord, recordEpoch, toPatient } from "./map";
import type { AlarmListRow, PatientSearchRow, VitalHistoryRow } from "./rows";

interface UidRow {
  UidCod: string;
  UidNam: string;
  UidDepCod: string;
  UidWadCod: string | null;
}

/** yyyyMMdd (m_uidmst 유효기간 비교용). */
function todayYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/**
 * m_uidmst 로 로그인 검증. 비밀번호는 SHA256 hex 로 해싱해 비교하고,
 * 유효기간(UidStrDte ≤ 오늘 ≤ UidEndDte) 안이어야 통과. 실패면 null.
 */
export async function validateLogin(userId: string, password: string): Promise<LoginUser | null> {
  if (!supabase) return null;
  const hash = await sha256hex(password);
  const today = todayYmd();
  const { data, error } = await supabase
    .from("m_uidmst")
    .select("UidCod,UidNam,UidDepCod,UidWadCod")
    .eq("UidCod", userId)
    .eq("UidPwd", hash)
    .lte("UidStrDte", today)
    .gte("UidEndDte", today)
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0] as UidRow | undefined;
  if (!row) return null;
  return { uid: row.UidCod, name: row.UidNam, depCod: row.UidDepCod, wadCod: row.UidWadCod ?? "" };
}

interface AckRow {
  cht_num: number;
  measured_ms: number;
}

/** 확인된 측정들의 키 집합 `${cht_num}:${measured_ms}`. */
async function fetchAckedKeys(chartNums: number[]): Promise<Set<string>> {
  if (!supabase || chartNums.length === 0) return new Set();
  const { data, error } = await supabase
    .from("p_vtlack")
    .select("cht_num, measured_ms")
    .in("cht_num", chartNums);
  if (error) throw error;
  return new Set(((data ?? []) as AckRow[]).map((a) => `${a.cht_num}:${a.measured_ms}`));
}

/** 병동의 환자 + 각자 최근 바이탈 → 웹 Patient[]. 바이탈 있는 환자만(모니터링 중). */
export async function fetchWardPatients(ward: string, ranges: RangesConfig): Promise<Patient[]> {
  if (!supabase) return [];

  const { data: pRows, error: pErr } = await supabase
    .from("v_patient_search")
    .select("*")
    .eq("wad_nam", `${ward}병동`);
  if (pErr) throw pErr;
  const patients = (pRows ?? []) as PatientSearchRow[];
  if (patients.length === 0) return [];

  const chartNums = patients
    .map((p) => parseInt(String(p.pat_cht_num), 10))
    .filter((n) => Number.isFinite(n));

  const [{ data: vRows, error: vErr }, ackedKeys] = await Promise.all([
    supabase.from("v_vital_history").select("*").in("cht_num", chartNums).order("record_time", { ascending: false }),
    fetchAckedKeys(chartNums),
  ]);
  if (vErr) throw vErr;

  // 환자별 최근 바이탈 1건만 남긴다 (record_time 내림차순 → 첫 등장이 최신).
  const latestByChart = new Map<number, VitalHistoryRow>();
  for (const v of (vRows ?? []) as VitalHistoryRow[]) {
    if (!latestByChart.has(v.cht_num)) latestByChart.set(v.cht_num, v);
  }

  const result: Patient[] = [];
  for (const p of patients) {
    const chart = parseInt(String(p.pat_cht_num), 10);
    const latest = latestByChart.get(chart);
    if (!latest) continue; // 오늘/최근 바이탈 없는 환자는 대시보드에서 제외
    // 확인 여부 = 이 환자의 "이번 측정"이 확인됐는가 (측정이 바뀌면 다시 미확인).
    const acked = ackedKeys.has(`${chart}:${recordEpoch(latest.record_time)}`);
    result.push(toPatient(p, latest, ranges, acked));
  }
  return result;
}

/**
 * 관제 스테이션 공통 설정 (전역 1행). 위험 기준치·알림음은 모든 PC 공유.
 * (볼륨은 PC 마다 다르게 두려고 DB 가 아니라 localStorage 에 저장 → 여기 없음.)
 */
export interface StationSettings {
  ranges: RangesConfig;
  soundOn: boolean;
}

/** 저장된 공통 설정을 읽는다. 없으면 null → 호출측이 기본값 사용. */
export async function fetchSettings(): Promise<StationSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("m_setmst")
    .select("Ranges,SoundOn")
    .eq("SetKey", "default")
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0] as { Ranges: RangesConfig; SoundOn: boolean } | undefined;
  if (!row) return null;
  return { ranges: row.Ranges, soundOn: row.SoundOn };
}

/** 공통 설정을 저장(upsert). 모든 관제 PC 가 공유한다. (볼륨 제외 — localStorage) */
export async function saveSettings(s: StationSettings): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("m_setmst").upsert(
    { SetKey: "default", Ranges: s.ranges, SoundOn: s.soundOn, UpdDtm: new Date().toISOString() },
    { onConflict: "SetKey" },
  );
  if (error) throw error;
}

/** 특정 측정시점을 확인 처리 (측정당 1건, 중복은 무시). */
export async function ackMeasurement(chartNo: string, measuredMs: number, uid: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("p_vtlack")
    .upsert(
      { cht_num: parseInt(chartNo, 10), measured_ms: measuredMs, ack_uid: uid },
      { onConflict: "cht_num,measured_ms", ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** 병동의 오늘 알림 이력. */
export async function fetchAlerts(ward: string): Promise<AlertRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("v_alarm_list")
    .select("*")
    .eq("wad_nam", `${ward}병동`)
    .order("create_dt", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AlarmListRow[]).map(alarmToRecord);
}

/** 환자 1명의 바이탈 이력 (상세 추세용 — 후속 단계에서 사용). */
export async function fetchVitalHistory(chartNo: string): Promise<VitalHistoryRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("v_vital_history")
    .select("*")
    .eq("cht_num", parseInt(chartNo, 10))
    .order("record_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VitalHistoryRow[];
}

/**
 * 바이탈/알림 테이블 INSERT 를 구독한다. 변경이 오면 onChange 호출(디바운스는 호출측).
 * @returns 구독 해제 함수
 */
export function subscribeToChanges(onChange: () => void): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel("vitalwatch-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "p_vtlinf" }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "p_alminf" }, onChange)
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}
