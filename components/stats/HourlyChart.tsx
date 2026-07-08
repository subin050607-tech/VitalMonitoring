"use client";

import { hash, mulberry32 } from "@/lib/rng";
import { C } from "@/lib/theme";

/** 시간대별 위험 알림 막대. 현재 시각 이후는 비우고, 현재 막대는 틸로 강조. */
export function HourlyChart({ ward }: { ward: string }) {
  const rng = mulberry32(hash(`hourly${ward}`));
  const cur = new Date().getHours();
  const data = Array.from({ length: 24 }, (_, i) => {
    let base = Math.floor(rng() * 3);
    if (i >= 6 && i <= 9) base += Math.floor(rng() * 3);
    if (i >= 18 && i <= 22) base += Math.floor(rng() * 4);
    return i <= cur ? base : 0;
  });
  const mx = Math.max(4, ...data);

  const W = 560;
  const H = 170;
  const padL = 24;
  const padB = 22;
  const padT = 10;
  const bw = (W - padL - 8) / 24;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {[0, 0.5, 1].map((f, i) => {
        const y = padT + (1 - f) * (H - padT - padB);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - 4} y2={y} stroke="#eef2f3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <text x={2} y={y + 3} fontSize={8.5} fill={C.faint} fontFamily="var(--font-plex-mono)">{Math.round(mx * f)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = (d / mx) * (H - padT - padB);
        const isNow = i === cur;
        return (
          <rect
            key={i}
            x={padL + i * bw + 1.5}
            y={H - padB - bh}
            width={bw - 3}
            height={bh}
            rx={2}
            fill={isNow ? C.teal : d >= 4 ? "#e39a86" : "#c9d4d9"}
          />
        );
      })}
      {[0, 6, 12, 18, 23].map((i) => (
        <text key={`x${i}`} x={padL + i * bw + bw / 2} y={H - 6} fontSize={8.5} fill={C.faint} fontFamily="var(--font-plex-mono)" textAnchor="middle">
          {String(i).padStart(2, "0")}
        </text>
      ))}
    </svg>
  );
}
