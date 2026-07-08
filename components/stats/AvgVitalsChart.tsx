"use client";

import { C, FONT } from "@/lib/theme";
import type { Patient } from "@/lib/types";
import { useRanges } from "../RangesContext";

interface Metric {
  label: string;
  unit: string;
  val: number;
  min: number;
  max: number;
  band: [number, number];
  dp: number;
}

/** 병동 평균 바이탈을 정상범위 대비 가로 막대로. 범위를 벗어나면 마커·값이 적색. */
export function AvgVitalsChart({ patients }: { patients: Patient[] }) {
  const ranges = useRanges();
  const avg = (k: keyof Patient["v"]) =>
    patients.length ? patients.reduce((a, p) => a + p.v[k], 0) / patients.length : 0;

  const metrics: Metric[] = [
    { label: "체온 Temp", unit: "°C", val: avg("temp"), min: 35, max: 40, band: ranges.temp.normal, dp: 1 },
    { label: "수축기 SBP", unit: "mmHg", val: avg("sbp"), min: 80, max: 180, band: ranges.sbp.normal, dp: 0 },
    { label: "맥박 HR", unit: "bpm", val: avg("hr"), min: 40, max: 140, band: ranges.hr.normal, dp: 0 },
    { label: "호흡 RR", unit: "/min", val: avg("rr"), min: 6, max: 30, band: ranges.rr.normal, dp: 0 },
    { label: "SpO₂", unit: "%", val: avg("spo2"), min: 85, max: 100, band: ranges.spo2.normal, dp: 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10, paddingBottom: 4 }}>
      {metrics.map((m, i) => {
        const pct = (x: number) => ((x - m.min) / (m.max - m.min)) * 100;
        const inRange = m.val >= m.band[0] && m.val <= m.band[1];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 104, fontSize: 12, color: "#54636c", fontWeight: 500, flex: "none" }}>{m.label}</div>
            <div style={{ flex: 1, position: "relative", height: 22, background: "#f1f4f5", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: `${pct(m.band[0])}%`, width: `${pct(m.band[1]) - pct(m.band[0])}%`, top: 0, bottom: 0, background: C.bandFill }} />
              <div style={{ position: "absolute", left: `calc(${pct(m.val)}% - 2px)`, top: -1, bottom: -1, width: 4, borderRadius: 2, background: inRange ? C.tealDeep : C.danger }} />
            </div>
            <div style={{ width: 74, textAlign: "right", flex: "none" }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 15, fontWeight: 600, color: inRange ? "#33454e" : C.dangerText }}>{m.val.toFixed(m.dp)}</span>
              <span style={{ fontSize: 10, color: C.muted2, marginLeft: 3, fontFamily: FONT.mono }}>{m.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
