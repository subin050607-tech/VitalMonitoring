"use client";

import { C, FONT } from "@/lib/theme";
import { axisStart } from "@/lib/series";
import type { Period, Status } from "@/lib/types";
import { statusColor } from "@/lib/vitals";

export interface ChartSpec {
  key: string;
  title: string;
  eng: string;
  unit: string;
  band: [number, number]; // 정상범위 [하한, 상한]
  cur: string; // 최근값 표시 텍스트
  st: Status;
  lines: { color: string; data: number[] }[]; // 첫 줄이 주선
}

const W = 430;
const H = 190;
const PAD_L = 38;
const PAD_R = 14;
const PAD_T = 30;
const PAD_B = 26;

export function LineChartCard({ spec, period }: { spec: ChartSpec; period: Period }) {
  const all = spec.lines.flatMap((l) => l.data).concat(spec.band);
  let mn = Math.min(...all);
  let mx = Math.max(...all);
  const pad = (mx - mn) * 0.18 || 1;
  mn -= pad;
  mx += pad;

  const len = spec.lines[0].data.length;
  const X = (i: number) => PAD_L + (i / (len - 1)) * (W - PAD_L - PAD_R);
  const Y = (v: number) => PAD_T + (1 - (v - mn) / (mx - mn)) * (H - PAD_T - PAD_B);
  const bandTop = Y(spec.band[1]);
  const bandBot = Y(spec.band[0]);
  const path = (data: number[]) => data.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const stColor = statusColor(spec.st);

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{spec.title}</span>
          <span style={{ fontSize: 11, color: C.muted2, marginLeft: 6 }}>{spec.eng}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 19, fontWeight: 600, color: stColor }}>{spec.cur}</span>
          <span style={{ fontSize: 10.5, color: C.muted2, fontFamily: FONT.mono }}>{spec.unit}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        {/* 정상범위 음영 */}
        <rect x={PAD_L} y={bandTop} width={W - PAD_L - PAD_R} height={Math.max(0, bandBot - bandTop)} fill={C.bandFill} />
        <line x1={PAD_L} y1={bandTop} x2={W - PAD_R} y2={bandTop} stroke={C.bandLine} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <line x1={PAD_L} y1={bandBot} x2={W - PAD_R} y2={bandBot} stroke={C.bandLine} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="#e6ebee" strokeWidth={1} vectorEffect="non-scaling-stroke" />

        {/* 추세선 (첫 줄 = 주선) */}
        {spec.lines.map((l, li) => (
          <path
            key={li}
            d={path(l.data)}
            fill="none"
            stroke={l.color}
            strokeWidth={li === 0 ? 2 : 1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={li === 0 ? 1 : 0.55}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {spec.lines.map((l, li) => (
          <circle key={`c${li}`} cx={X(len - 1)} cy={Y(l.data[len - 1])} r={3} fill={l.color} />
        ))}

        {/* 범위·축 라벨 */}
        <text x={4} y={bandTop + 3} fontSize={9} fill="#7fa896" fontFamily="var(--font-plex-mono)">{spec.band[1]}</text>
        <text x={4} y={bandBot + 3} fontSize={9} fill="#7fa896" fontFamily="var(--font-plex-mono)">{spec.band[0]}</text>
        <text x={PAD_L} y={H - 8} fontSize={9} fill={C.faint} fontFamily="var(--font-plex-mono)">{axisStart(period)}</text>
        <text x={W - PAD_R} y={H - 8} fontSize={9} fill={C.faint} fontFamily="var(--font-plex-mono)" textAnchor="end">now</text>
      </svg>
    </div>
  );
}
