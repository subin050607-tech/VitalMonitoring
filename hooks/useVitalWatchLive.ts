"use client";

/**
 * VitalWatch 관제 상태 훅 (라이브 · Supabase 전용).
 *
 *  - 초기/병동변경/기준치변경 시 v_patient_search + v_vital_history 조회
 *  - p_vtlinf / p_alminf / p_vtlack INSERT 를 Realtime 구독 → 디바운스 재조회
 *    (모바일 앱이 바이탈을 입력하면 새로고침 없이 대시보드가 갱신됨)
 *  - 확인(Acknowledge)은 p_vtlack(측정 1건당 1행)에 서버 저장 → 여러 관제 PC 가
 *    공유하고, 새 측정이 오면 다시 미확인이 되어 재악화 시 재알림된다.
 *  - 상세 진입 시 선택 환자의 실측 이력(v_vital_history)을 시계열로 조회.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { AlertRecord } from "@/lib/alerts";
import { fmtClock } from "@/lib/format";
import {
  ackMeasurement,
  fetchAlerts,
  fetchVitalHistory,
  fetchWardPatients,
  subscribeToChanges,
} from "@/lib/supabase/queries";
import { toSeries } from "@/lib/supabase/map";
import type {
  Layers,
  LoginUser,
  Patient,
  Period,
  RangesConfig,
  ScreenName,
  Toast,
  VitalKey,
  VitalSeries,
} from "@/lib/types";
import { DEFAULT_RANGES, vStatus, worstBp } from "@/lib/vitals";

/** 로그인 사용자가 없을 때의 안전 기본값 (정상 흐름에선 로그인 시 실제 사용자로 채워짐). */
const DEFAULT_USER: LoginUser = { uid: "nurse1", name: "이정민", depCod: "D1" };

export interface State {
  authed: boolean;
  user: LoginUser | null;
  patients: Patient[];
  ward: string;
  screen: ScreenName;
  selectedId: string;
  detailReturn: ScreenName;
  period: Period;
  layers: Layers;
  ranges: RangesConfig;
  toasts: Toast[];
  now: Date;
  alertToday: number;
  dangerPatientsToday: number;
}

export interface VitalWatch {
  state: State;
  liveAlerts: AlertRecord[];
  selectedSeries?: VitalSeries;
  login: (user?: LoginUser) => void;
  logout: () => void;
  ackPatient: (id: string) => void;
  dismissToast: (id: string) => void;
  setWard: (ward: string) => void;
  goScreen: (screen: ScreenName) => void;
  openDetail: (id: string, from?: ScreenName) => void;
  setPeriod: (period: Period) => void;
  toggleLayer: (key: VitalKey) => void;
  setRanges: (ranges: RangesConfig) => void;
}

function initialState(): State {
  return {
    authed: false,
    user: null,
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
  const [selectedSeries, setSelectedSeries] = useState<VitalSeries | undefined>(undefined);

  const dismissedRef = useRef<Set<string>>(new Set());
  const stateRef = useRef(state);
  stateRef.current = state;
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const s = stateRef.current;
    if (!s.authed) return;
    try {
      const [patients, alerts] = await Promise.all([
        fetchWardPatients(s.ward, s.ranges),
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

  // 상세 진입 시 선택 환자의 실측 이력 조회
  useEffect(() => {
    if (!state.authed || state.screen !== "detail" || !state.selectedId) return;
    let alive = true;
    setSelectedSeries(undefined); // 환자 전환 시 이전 추세를 비워 잘못된 그래프 방지(그 사이 genSeries 폴백)
    fetchVitalHistory(state.selectedId)
      .then((rows) => {
        if (alive) setSelectedSeries(toSeries(rows));
      })
      .catch((e) => console.error("[VitalWatch live] 이력 조회 실패:", e));
    return () => {
      alive = false;
    };
  }, [state.authed, state.screen, state.selectedId]);

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
  const login = useCallback(
    (user?: LoginUser) => setState((s) => ({ ...s, authed: true, user: user ?? DEFAULT_USER })),
    [],
  );
  const logout = useCallback(
    () => setState((s) => ({ ...s, authed: false, user: null, screen: "dashboard" })),
    [],
  );

  const ackPatient = useCallback((id: string) => {
    const s0 = stateRef.current;
    const patient = s0.patients.find((p) => p.id === id);
    if (!patient) return;
    const user = s0.user ?? DEFAULT_USER;
    // 서버에 확인 기록 (측정시점 + 로그인 사용자). 실패해도 UI 는 낙관적으로 처리 후 재조회로 정정.
    ackMeasurement(id, patient.measured, user.uid).catch((e) =>
      console.error("[VitalWatch live] 확인 저장 실패:", e),
    );
    setState((s) => {
      const patients = s.patients.map((p) =>
        p.id === id ? { ...p, acknowledged: true, ackBy: user.name, ackAt: fmtClock(new Date()) } : p,
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
    selectedSeries,
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
