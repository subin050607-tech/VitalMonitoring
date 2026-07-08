"use client";

/**
 * VitalWatch 관제 상태 + 라이브 시뮬레이션 훅.
 *
 * 원본 시안의 DCLogic 컴포넌트를 React 훅으로 옮긴 것. 1초 간격으로
 *  - 3틱마다 전 환자 바이탈에 미세 지터를 주고 상태를 재판정하며,
 *  - 스크립트된 시각(_events)에 특정 환자를 악화시켜 토스트를 띄운다.
 * 실시간 소스(WebSocket/SSE/실시간 DB)가 준비되면 이 훅만 교체하면 된다.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { genPatients, seedToasts } from "@/lib/patients";
import { fmtClock } from "@/lib/format";
import type { AlertRecord } from "@/lib/alerts";
import type {
  Layers,
  Patient,
  Period,
  RangesConfig,
  ScreenName,
  Toast,
  VitalKey,
  Vitals,
} from "@/lib/types";
import { DEFAULT_RANGES, patientStatus } from "@/lib/vitals";

export interface State {
  authed: boolean;
  patients: Patient[];
  ward: string;
  screen: ScreenName;
  selectedId: string;
  detailReturn: ScreenName; // 상세에서 "뒤로" 눌렀을 때 돌아갈 화면
  period: Period;
  layers: Layers;
  ranges: RangesConfig;
  toasts: Toast[];
  now: Date;
  alertToday: number;
  dangerPatientsToday: number;
}

/** 데모용으로 미리 짜둔 악화 이벤트 (틱 시각, 대상 환자, 항목). */
interface DeteriorationEvent {
  at: number;
  ward: string;
  name: string;
  kind: "spo2" | "hr" | "bp";
}
const EVENTS: DeteriorationEvent[] = [
  { at: 9, ward: "5", name: "서지안", kind: "spo2" },
  // 원본 시안의 이름을 그대로 유지 (6병동 명단에 없어 no-op) — 동작을 시안과 동일하게 둔다.
  { at: 20, ward: "6", name: "권민서", kind: "hr" },
  { at: 34, ward: "5", name: "윤재호", kind: "bp" },
];

function initialState(): State {
  const now = Date.now();
  const patients = genPatients(now);
  const firstDanger = patients.find((p) => p.ward === "5" && p.status === "danger");
  return {
    authed: false,
    patients,
    ward: "5",
    screen: "dashboard",
    selectedId: firstDanger ? firstDanger.id : patients[0].id,
    detailReturn: "dashboard",
    period: "24h",
    layers: { temp: true, bp: true, hr: true, rr: true, spo2: true },
    ranges: DEFAULT_RANGES,
    toasts: seedToasts(patients, now),
    now: new Date(now),
    alertToday: 27,
    dangerPatientsToday: 6,
  };
}

/** 3틱마다 주는 미세 지터 — 실측값이 살아있는 것처럼 흔들리게. */
function jitterPatients(ranges: RangesConfig, patients: Patient[], now: number): Patient[] {
  const jit = (x: number, amp: number, dp: number) =>
    +(x + (Math.random() - 0.5) * amp).toFixed(dp);
  return patients.map((p) => {
    const nv: Vitals = {
      temp: jit(p.v.temp, 0.14, 1),
      sbp: Math.round(jit(p.v.sbp, 2.4, 0)),
      dbp: Math.round(jit(p.v.dbp, 2.0, 0)),
      hr: Math.round(jit(p.v.hr, 2.6, 0)),
      rr: Math.round(jit(p.v.rr, 0.9, 0)),
      spo2: Math.min(100, Math.round(jit(p.v.spo2, 0.8, 0))),
    };
    return { ...p, v: nv, status: patientStatus(ranges, nv), measured: now };
  });
}

export interface VitalWatch {
  state: State;
  /** 라이브(Supabase) 모드에서만 채워지는 알림 이력. 시뮬 모드는 undefined. */
  liveAlerts?: AlertRecord[];
  login: () => void;
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

export function useVitalWatch(): VitalWatch {
  const [state, setState] = useState<State>(initialState);
  const tickRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      setState((s) => {
        const now = new Date();
        let patients = s.patients;
        let toasts = s.toasts;
        let alertToday = s.alertToday;

        if (tick % 3 === 0) {
          patients = jitterPatients(s.ranges, patients, now.getTime());
        }

        const ev = EVENTS.find((e) => e.at === tick);
        if (ev) {
          patients = patients.map((p) => {
            if (p.name !== ev.name) return p;
            const nv: Vitals = { ...p.v };
            if (ev.kind === "spo2") {
              nv.spo2 = 89;
              nv.hr = 116;
              nv.rr = 23;
            } else if (ev.kind === "hr") {
              nv.hr = 128;
              nv.rr = 22;
            } else if (ev.kind === "bp") {
              nv.sbp = 178;
              nv.dbp = 108;
            }
            return {
              ...p,
              v: nv,
              status: patientStatus(s.ranges, nv),
              acknowledged: false,
              ackBy: "",
              ackAt: "",
              measured: now.getTime(),
            };
          });
          const tp = patients.find((p) => p.name === ev.name);
          if (tp) {
            const itemMap: Record<DeteriorationEvent["kind"], [string, string]> = {
              spo2: ["SpO₂ 산소포화도", `${tp.v.spo2}%`],
              hr: ["HR 맥박", `${tp.v.hr} bpm`],
              bp: ["BP 혈압", `${tp.v.sbp}/${tp.v.dbp}`],
            };
            const [item, value] = itemMap[ev.kind];
            toasts = [
              { id: `ev-${tick}`, pid: tp.id, name: tp.name, room: tp.room, item, value, time: fmtClock(now) },
              ...toasts,
            ].slice(0, 4);
            alertToday += 1;
          }
        }

        return { ...s, patients, toasts, now, alertToday };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ackPatient = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      patients: s.patients.map((p) =>
        p.id === id ? { ...p, acknowledged: true, ackBy: "이정민", ackAt: fmtClock(new Date()) } : p,
      ),
      toasts: s.toasts.filter((t) => t.pid !== id),
    }));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }));
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

  const login = useCallback(() => setState((s) => ({ ...s, authed: true })), []);
  const logout = useCallback(
    () => setState((s) => ({ ...s, authed: false, screen: "dashboard" })),
    [],
  );

  // 기준치를 바꾸면 그 자리에서 전 환자 상태를 재판정해 대시보드에 즉시 반영한다.
  const setRanges = useCallback(
    (ranges: RangesConfig) =>
      setState((s) => ({
        ...s,
        ranges,
        patients: s.patients.map((p) => ({ ...p, status: patientStatus(ranges, p.v) })),
      })),
    [],
  );

  return {
    state,
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
