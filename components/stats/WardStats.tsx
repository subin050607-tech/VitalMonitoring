"use client";

import { C, FONT } from "@/lib/theme";
import type { Patient } from "@/lib/types";
import { PressButton } from "../PressButton";
import { trackStyle, wardTab } from "../segStyles";
import { AvgVitalsChart } from "./AvgVitalsChart";
import { DonutChart } from "./DonutChart";
import { HourlyChart } from "./HourlyChart";

interface Kpi {
  label: string;
  value: string;
  unit: string;
  sub: string;
  color: string;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{kpi.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 32, fontWeight: 700, color: kpi.color }}>{kpi.value}</span>
        <span style={{ fontSize: 12, color: C.muted2, fontWeight: 500 }}>{kpi.unit}</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted3, marginTop: 5 }}>{kpi.sub}</div>
    </div>
  );
}

const cardBox: React.CSSProperties = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12 };
const cardTitle = (title: string, eng: string) => (
  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
    {title} <span style={{ color: C.muted2, fontWeight: 500, fontSize: 11.5 }}>{eng}</span>
  </div>
);

export function WardStats({
  patients,
  ward,
  setWard,
  alertToday,
  dangerPatientsToday,
}: {
  patients: Patient[];
  ward: string;
  setWard: (w: string) => void;
  alertToday: number;
  dangerPatientsToday: number;
}) {
  const cautionAll = patients.filter((p) => p.status === "caution").length;
  const avgSpo2 = patients.length
    ? (patients.reduce((a, p) => a + p.v.spo2, 0) / patients.length).toFixed(1)
    : "0.0";

  const kpis: Kpi[] = [
    { label: "당일 위험 알림 총 횟수", value: String(alertToday), unit: "건", sub: "Total critical alerts today", color: C.dangerText },
    { label: "위험 발생 환자 수", value: String(dangerPatientsToday), unit: "명", sub: "Patients with a critical event", color: C.ink },
    { label: "현재 주의 환자", value: String(cautionAll), unit: "명", sub: "Currently in WATCH", color: C.cautionText },
    { label: "평균 산소포화도", value: avgSpo2, unit: "%", sub: "Ward mean SpO₂", color: C.tealDeep },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
      {/* 헤더 */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: C.subBg, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          병동 통계 <span style={{ color: C.muted2, fontWeight: 500, fontSize: 12.5 }}>Ward Analytics · 오늘 Today</span>
        </span>
        <div style={{ flex: 1 }} />
        <div style={trackStyle}>
          <PressButton onClick={() => setWard("5")} ariaPressed={ward === "5"} style={wardTab(ward === "5")}>5병동</PressButton>
          <PressButton onClick={() => setWard("6")} ariaPressed={ward === "6"} style={wardTab(ward === "6")}>6병동</PressButton>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 32px" }}>
        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
          {kpis.map((k) => (
            <KpiCard key={k.label} kpi={k} />
          ))}
        </div>

        {/* 시간대별 + 도넛 */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ ...cardBox, padding: "16px 18px 8px" }}>
            {cardTitle("시간대별 위험 알림", "Alerts by hour")}
            <HourlyChart ward={ward} />
          </div>
          <div style={{ ...cardBox, padding: "16px 18px" }}>
            {cardTitle("현재 환자 상태 분포", "Status mix")}
            <DonutChart patients={patients} />
          </div>
        </div>

        {/* 평균 바이탈 */}
        <div style={{ ...cardBox, padding: "16px 18px 10px" }}>
          {cardTitle("평균 바이탈 분포", "Average vitals vs. normal range")}
          <AvgVitalsChart patients={patients} />
        </div>
      </div>
    </div>
  );
}
