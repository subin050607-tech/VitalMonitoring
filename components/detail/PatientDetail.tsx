"use client";

import type { CSSProperties } from "react";

import { periodLabel } from "@/lib/series";
import { C, FONT, VITAL_COLORS } from "@/lib/theme";
import type { Patient, Period, RangesConfig, Status, VitalKey, VitalSeries } from "@/lib/types";
import { vStatus } from "@/lib/vitals";
import { ChevronLeft } from "../icons";
import { PressButton } from "../PressButton";
import { useRanges } from "../RangesContext";
import { periodTab, trackStyle } from "../segStyles";
import { ChartSpec, LineChartCard } from "./LineChartCard";

const STATUS_TEXT: Record<Status, string> = {
  danger: "위험 CRITICAL",
  caution: "주의 WATCH",
  normal: "정상 STABLE",
};

/** 선택 환자 상태 배지 스타일. */
function badgeStyle(st: Status): CSSProperties {
  const map: Record<Status, [string, string, string]> = {
    danger: [C.dangerBg, C.dangerText, "#f0b9b6"],
    caution: [C.cautionBgAlt, C.cautionDeep, C.cautionBorder],
    normal: [C.normalBadgeBg, "#54636c", C.border],
  };
  const [bg, color, border] = map[st];
  return { padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: bg, color, border: `1px solid ${border}` };
}

const LAYER_DEFS: { key: VitalKey; label: string; color: string }[] = [
  { key: "temp", label: "체온", color: VITAL_COLORS.temp },
  { key: "bp", label: "혈압", color: VITAL_COLORS.bp },
  { key: "hr", label: "맥박", color: VITAL_COLORS.hr },
  { key: "rr", label: "호흡", color: VITAL_COLORS.rr },
  { key: "spo2", label: "SpO₂", color: VITAL_COLORS.spo2 },
];

const PERIOD_MS: Record<Period, number> = { "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000 };

/** 실측 시계열에서 기간 내 값만. 기간 필터로 2개 미만이면 전체 점을 쓴다. */
function lineData(series: VitalSeries, key: keyof Omit<VitalSeries, "times">, period: Period): number[] {
  const cutoff = Date.now() - PERIOD_MS[period];
  const picked: number[] = [];
  for (let i = 0; i < series.times.length; i++) {
    if (series.times[i] >= cutoff) picked.push(series[key][i]);
  }
  return picked.length >= 2 ? picked : series[key];
}

function buildSpecs(
  ranges: RangesConfig,
  p: Patient,
  layers: Record<VitalKey, boolean>,
  period: Period,
  series: VitalSeries,
): ChartSpec[] {
  const v = p.v;
  const specs: (ChartSpec & { show: boolean })[] = [
    {
      key: "temp", show: layers.temp, title: "체온", eng: "Body Temp", unit: "°C", band: ranges.temp.normal,
      cur: v.temp.toFixed(1), st: vStatus(ranges, "temp", v.temp),
      lines: [{ color: VITAL_COLORS.temp, data: lineData(series, "temp", period) }],
    },
    {
      key: "bp", show: layers.bp, title: "혈압", eng: "Blood Pressure", unit: "mmHg", band: [ranges.dbp.normal[0], ranges.sbp.normal[1]],
      cur: `${v.sbp}/${v.dbp}`, st: vStatus(ranges, "sbp", v.sbp),
      lines: [
        { color: VITAL_COLORS.bp, data: lineData(series, "sbp", period) },
        { color: "#b39ae0", data: lineData(series, "dbp", period) },
      ],
    },
    {
      key: "hr", show: layers.hr, title: "맥박", eng: "Heart Rate", unit: "bpm", band: ranges.hr.normal,
      cur: String(v.hr), st: vStatus(ranges, "hr", v.hr),
      lines: [{ color: VITAL_COLORS.hr, data: lineData(series, "hr", period) }],
    },
    {
      key: "rr", show: layers.rr, title: "호흡수", eng: "Resp. Rate", unit: "/min", band: ranges.rr.normal,
      cur: String(v.rr), st: vStatus(ranges, "rr", v.rr),
      lines: [{ color: VITAL_COLORS.rr, data: lineData(series, "rr", period) }],
    },
    {
      key: "spo2", show: layers.spo2, title: "산소포화도", eng: "SpO₂", unit: "%", band: ranges.spo2.normal,
      cur: String(v.spo2), st: vStatus(ranges, "spo2", v.spo2),
      lines: [{ color: VITAL_COLORS.spo2, data: lineData(series, "spo2", period) }],
    },
  ];
  return specs.filter((s) => s.show);
}

export function PatientDetail({
  patient,
  layers,
  toggleLayer,
  period,
  setPeriod,
  goBack,
  backLabel,
  series,
}: {
  patient: Patient;
  layers: Record<VitalKey, boolean>;
  toggleLayer: (k: VitalKey) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  goBack: () => void;
  backLabel: string;
  series?: VitalSeries; // 선택 환자의 실측 시계열 (v_vital_history)
}) {
  const ranges = useRanges();
  const st = patient.status;
  // 측정이 2회 이상 쌓여야 추세선을 그린다. 그 전엔 안내 문구.
  const hasTrend = !!series && series.times.length >= 2;
  const specs = hasTrend ? buildSpecs(ranges, patient, layers, period, series) : [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
      {/* 헤더 */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: C.subBg, borderBottom: `1px solid ${C.borderSoft}` }}>
        <PressButton onClick={goBack} ariaLabel={`${backLabel} 돌아가기`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: C.tealDeep }}>
          <ChevronLeft size={15} /> {backLabel}
        </PressButton>
        <div style={{ width: 1, height: 26, background: C.borderSoft }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>{patient.name}</span>
          <span style={{ fontSize: 12.5, color: C.muted4 }}>{`${patient.room} · ${patient.ageSex} · ${patient.chartNo}`}</span>
          <span style={badgeStyle(st)}>{STATUS_TEXT[st]}</span>
        </div>
        <div style={{ flex: 1 }} />

        {/* 레이어 토글 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: C.muted2, textTransform: "uppercase", letterSpacing: ".03em", marginRight: 2 }}>항목 Layers</span>
          {LAYER_DEFS.map(({ key, label, color }) => {
            const on = layers[key];
            return (
              <PressButton
                key={key}
                onClick={() => toggleLayer(key)}
                ariaPressed={on}
                ariaLabel={`${label} 그래프 ${on ? "숨기기" : "보기"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 9px",
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: 600,
                  border: `1px solid ${on ? color : "#dbe2e6"}`,
                  background: on ? `${color}14` : "#fff",
                  color: on ? color : C.faint,
                  textDecoration: on ? "none" : "line-through",
                }}
              >
                {label}
              </PressButton>
            );
          })}
        </div>

        <div style={{ width: 1, height: 26, background: C.borderSoft }} />

        {/* 기간 */}
        <div style={trackStyle}>
          <PressButton onClick={() => setPeriod("24h")} ariaPressed={period === "24h"} style={periodTab(period === "24h")}>24h</PressButton>
          <PressButton onClick={() => setPeriod("7d")} ariaPressed={period === "7d"} style={periodTab(period === "7d")}>7d</PressButton>
          <PressButton onClick={() => setPeriod("30d")} ariaPressed={period === "30d"} style={periodTab(period === "30d")}>30d</PressButton>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 11.5, color: C.muted }}>
          <span style={{ display: "inline-block", width: 26, height: 11, borderRadius: 3, background: C.bandFill, border: `1px solid ${C.bandLine}` }} />
          음영 = 정상범위 Normal range
          <span style={{ marginLeft: 6, fontFamily: FONT.mono }}>·</span>
          기간 {periodLabel(period)} · 실측 추세 Trend
        </div>
        {hasTrend ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(430px,1fr))", gap: 14 }}>
            {specs.map((s) => (
              <LineChartCard key={s.key} spec={s} period={period} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted3, fontSize: 13 }}>
            측정이 2회 이상 쌓이면 추세 그래프가 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
