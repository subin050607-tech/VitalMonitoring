"use client";

import { C, FONT } from "@/lib/theme";
import type { Patient } from "@/lib/types";

/** 현재 병동 환자의 위험/주의/정상 분포 도넛. */
export function DonutChart({ patients }: { patients: Patient[] }) {
  const d = patients.filter((p) => p.status === "danger").length;
  const c = patients.filter((p) => p.status === "caution").length;
  const n = patients.length - d - c;
  const total = patients.length;
  const segs = [
    { v: d, color: C.danger, label: "위험" },
    { v: c, color: C.caution, label: "주의" },
    { v: n, color: C.normal, label: "정상" },
  ];

  const cx = 90;
  const cy = 90;
  const r = 64;
  const sw = 26;
  const circumference = 2 * Math.PI * r;
  let acc = -Math.PI / 2;
  const arcs = segs.map((s, i) => {
    const frac = total ? s.v / total : 0;
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={sw}
        strokeDasharray={`${frac * circumference} ${circumference}`}
        strokeDashoffset={(-(acc + Math.PI / 2) / (2 * Math.PI)) * circumference}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
    );
    acc += frac * 2 * Math.PI;
    return el;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8 }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f3" strokeWidth={sw} />
        {arcs}
        <text x={cx} y={cy - 4} fontSize={30} fontWeight={700} fill={C.ink} textAnchor="middle" fontFamily="var(--font-plex-mono)">{total}</text>
        <text x={cx} y={cy + 16} fontSize={11} fill={C.muted2} textAnchor="middle">명 총원</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color }} />
            <span style={{ fontSize: 12.5, color: "#54636c", minWidth: 34 }}>{s.label}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 15, fontWeight: 600, color: "#33454e" }}>{s.v}</span>
            <span style={{ fontSize: 11, color: C.faint }}>명</span>
          </div>
        ))}
      </div>
    </div>
  );
}
