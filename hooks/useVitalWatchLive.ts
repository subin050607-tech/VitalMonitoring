"use client";

/**
 * useVitalWatch 의 라이브(Supabase) 버전. 시뮬레이션 훅과 동일한 VitalWatch
 * 인터페이스를 노출해 VitalWatchApp 이 그대로 소비한다.
 *
 *  - 초기/병동변경/기준치변경 시 v_patient_search + v_vital_history 조회
 *  - p_vtlinf / p_alminf INSERT 를 Realtime 구독 → 디바운스 후 재조회(새로고침 없이 갱신)
 *  - 확인(Acknowledge)은 서버에 확인 컬럼이 없어 클라이언트(localStorage)로 유지
 *    (추후 스키마에 ack 테이블/컬럼을 추가하면 서버 반영으로 교체)
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { AlertRecord } from "@/lib/alerts";
import { fmtClock } from "@/lib/format";
import { fetchAlerts, fetchWardPatients, subscribeToChanges } from "@/lib/supabase/queries";
import type { Patient, Period, RangesConfig, ScreenName, Toast, VitalKey } from "@/lib/types";
import { DEFAULT_RANGES, vStatus, worstBp } from "@/lib/vitals";
import type { State, VitalWatch } from "./useVitalWatch";

const ACK_KEY = "vitalwatch.ackedIds";

function initialState(): State {
  return {
    authed: false,
    patients: [],
    ward: "5",
    screen: "dashboard",
    selectedId: "",
    detailReturn: "dashboard",
    period: "24h",
    layers: { temp: true, bp: true, hr: true, rr: true, spo2: true },
    ranges: DEFAULT_RANGES,
    toasts: [],
    now: new Date(),
    alertToday: 0,
    dangerPatientsToday: 0,
  };
}

/** 위험 환자의 가장 심각한 항목을 토스트 문구로. (spo2>체온>혈압>맥박>호흡 순) */
function worstVital(p: Patient, ranges: RangesConfig): { item: string; value: string } {
  const v = p.v;
  if (vStatus(ranges, "spo2", v.spo2) === "danger") return { item: "SpO₂ 산소포화도", value: `${v.spo2}%` };
  if (vStatus(ranges, "temp", v.temp) === "danger") return { item: "체온", value: `${v.temp}℃` };
  if (worstBp(ranges, v) === "danger") return { item: "혈압", value: `${v.sbp}/${v.dbp}` };
  if (vStatus(ranges, "hr", v.hr) === "danger") return { item: "맥박", value: `${v.hr} bpm` };
  if (vStatus(ranges, "rr", v.rr) === "danger") return { item: "호흡", value: `${v.rr}/min` };
  return { item: "위험", value: "" };
}

/** 미확인 위험 환자를 토스트로 (닫은 것 제외, 최대 4). */
function buildToasts(patients: Patient[], ranges: RangesConfig, dismissed: Set<string>): Toast[] {
  return patients
    .filter((p) => p.status === "danger" && !p.acknowledged && !dismissed.has(`t-${p.id}`))
    .slice(0, 4)
    .map((p) => {
      const { item, value } = worstVital(p, ranges);
      return {
        id: `t-${p.id}`,
        pid: p.id,
        name: p.name,
        room: p.room.split(" ").slice(1).join(" "),
        item,
        value,
        time: fmtClock(new Date(p.measured)),
      };
    });
}

export function useVitalWatchLive(): VitalWatch {
  const [state, setState] = useState<State>(initialState);
  const [liveAlerts, setLiveAlerts] = useState<AlertRecord[]>([]);

  const ackedRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());
  const stateRef = useRef(state);
  stateRef.current = state;
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 확인 이력을 localStorage 에서 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACK_KEY);
      if (raw) ackedRef.current = new Set(JSON.parse(raw) as string[]);
    } catch {
      /* noop */
    }
  }, []);

  const refresh = useCallback(async () => {
    const s = stateRef.current;
    if (!s.authed) return;
    try {
      const [patients, alerts] = await Promise.all([
        fetchWardPatients(s.ward, s.ranges, ackedRef.current),
        fetchAlerts(s.ward),
      ]);
      setLiveAlerts(alerts);
      setState((prev) => ({
        ...prev,
        patients,
        toasts: buildToasts(patients, prev.ranges, dismissedRef.current),
        alertToday: alerts.length,
        dangerPatientsToday: new Set(alerts.map((a) => a.name)).size,
        selectedId: prev.selectedId || patients[0]?.id || "",
      }));
    } catch (e) {
      console.error("[VitalWatch live] 조회 실패:", e);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refresh, 400);
  }, [refresh]);

  // 인증/병동/기준치 변경 시 재조회
  useEffect(() => {
    if (state.authed) refresh();
  }, [state.authed, state.ward, state.ranges, refresh]);

  // Realtime 구독 + LIVE 시계
  useEffect(() => {
    if (!state.authed) return;
    const unsub = subscribeToChanges(scheduleRefresh);
    const clock = setInterval(() => setState((p) => ({ ...p, now: new Date() })), 1000);
    return () => {
      unsub();
      clearInterval(clock);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [state.authed, scheduleRefresh]);

  // ── 액션 ──
  const login = useCallback(() => setState((s) => ({ ...s, authed: true })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, authed: false, screen: "dashboard" })), []);

  const ackPatient = useCallback((id: string) => {
    ackedRef.current.add(id);
    try {
      localStorage.setItem(ACK_KEY, JSON.stringify([...ackedRef.current]));
    } catch {
      /* noop */
    }
    setState((s) => {
      const patients = s.patients.map((p) =>
        p.id === id ? { ...p, acknowledged: true, ackBy: "이정민", ackAt: fmtClock(new Date()) } : p,
      );
      return { ...s, patients, toasts: buildToasts(patients, s.ranges, dismissedRef.current) };
    });
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    dismissedRef.current.add(toastId);
    setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== toastId) }));
  }, []);

  const setWard = useCallback((ward: string) => setState((s) => ({ ...s, ward })), []);
  const goScreen = useCallback((screen: ScreenName) => setState((s) => ({ ...s, screen })), []);
  const openDetail = useCallback(
    (id: string, from: ScreenName = "dashboard") =>
      setState((s) => ({ ...s, screen: "detail", selectedId: id, detailReturn: from })),
    [],
  );
  const setPeriod = useCallback((period: Period) => setState((s) => ({ ...s, period })), []);
  const toggleLayer = useCallback(
    (key: VitalKey) => setState((s) => ({ ...s, layers: { ...s.layers, [key]: !s.layers[key] } })),
    [],
  );
  const setRanges = useCallback((ranges: RangesConfig) => setState((s) => ({ ...s, ranges })), []);

  return {
    state,
    liveAlerts,
    login,
    logout,
    ackPatient,
    dismissToast,
    setWard,
    goScreen,
    openDetail,
    setPeriod,
    toggleLayer,
    setRanges,
  };
}
