/** Supabase 뷰 조회 + Realtime 구독. supabase 가 null(비활성)이면 빈 결과. */

import type { AlertRecord } from "../alerts";
import type { Patient, RangesConfig } from "../types";
import { supabase } from "./client";
import { alarmToRecord, toPatient } from "./map";
import type { AlarmListRow, PatientSearchRow, VitalHistoryRow } from "./rows";

/** 병동의 환자 + 각자 최근 바이탈 → 웹 Patient[]. 바이탈 있는 환자만(모니터링 중). */
export async function fetchWardPatients(
  ward: string,
  ranges: RangesConfig,
  ackedIds: Set<string>,
): Promise<Patient[]> {
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

  const { data: vRows, error: vErr } = await supabase
    .from("v_vital_history")
    .select("*")
    .in("cht_num", chartNums)
    .order("record_time", { ascending: false });
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
    result.push(toPatient(p, latest, ranges, ackedIds.has(String(p.pat_cht_num))));
  }
  return result;
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
