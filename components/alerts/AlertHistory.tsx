"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { genAlerts } from "@/lib/alerts";
import { fmtClock } from "@/lib/format";
import { C, FONT } from "@/lib/theme";
import type { Patient } from "@/lib/types";
import { PressButton } from "../PressButton";
import { trackStyle, wardTab } from "../segStyles";

type AckFilter = "all" | "unacked" | "acked";

const FILTERS: { key: AckFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "unacked", label: "미확인" },
  { key: "acked", label: "확인됨" },
];

const th: CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#f4f7f8",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: C.muted,
  textTransform: "uppercase",
  letterSpacing: ".03em",
  padding: "10px 14px",
  borderBottom: `1px solid ${C.borderSoft}`,
  whiteSpace: "nowrap",
};
const td: CSSProperties = { padding: "11px 14px", borderBottom: "1px solid #eef2f3", fontSize: 13, color: C.ink };

function AckBadge({ acked }: { acked: boolean }) {
  if (acked) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: C.normalBadgeBg, color: "#54636c", fontSize: 11.5, fontWeight: 600 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.normal }} /> 확인됨
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}`, fontSize: 11.5, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.danger }} /> 미확인
    </span>
  );
}

function Kpi({ label, value, unit, sub, color }: { label: string; value: string; unit: string; sub: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.muted }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 700, color }}>{value}</span>
        <span style={{ fontSize: 12, color: C.muted2, fontWeight: 500 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 10.5, color: C.muted3, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export function AlertHistory({
  patients,
  ward,
  setWard,
  alertToday,
}: {
  patients: Patient[];
  ward: string;
  setWard: (w: string) => void;
  alertToday: number;
}) {
  // 이력은 화면 진입 시점에 한 번 고정 (매 틱 재생성 방지).
  const [allAlerts] = useState(() => genAlerts(patients, Date.now(), alertToday));
  const [filter, setFilter] = useState<AckFilter>("all");

  const wardAlerts = allAlerts.filter((a) => a.ward === ward);
  const rows = wardAlerts.filter((a) => filter === "all" || (filter === "acked" ? a.acked : !a.acked));

  const unackedCount = wardAlerts.filter((a) => !a.acked).length;
  const ackedRecords = wardAlerts.filter((a) => a.acked);
  const avgAckSec = ackedRecords.length
    ? Math.round(ackedRecords.reduce((s, a) => s + a.ackAfterSec, 0) / ackedRecords.length)
    : 0;
  const avgAckLabel = `${Math.floor(avgAckSec / 60)}분 ${avgAckSec % 60}초`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
      {/* 서브 헤더 */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: C.subBg, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          알림 이력 <span style={{ color: C.muted2, fontWeight: 500, fontSize: 12.5 }}>Alert Log · 오늘 Today</span>
        </span>
        <div style={trackStyle}>
          <PressButton onClick={() => setWard("5")} ariaPressed={ward === "5"} style={wardTab(ward === "5")}>5병동</PressButton>
          <PressButton onClick={() => setWard("6")} ariaPressed={ward === "6"} style={wardTab(ward === "6")}>6병동</PressButton>
        </div>
        <div style={trackStyle}>
          {FILTERS.map((f) => (
            <PressButton
              key={f.key}
              onClick={() => setFilter(f.key)}
              ariaPressed={filter === f.key}
              style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: filter === f.key ? 600 : 500, cursor: "pointer", background: filter === f.key ? C.navBg : "transparent", color: filter === f.key ? "#fff" : "#5b6b74" }}
            >
              {f.label}
            </PressButton>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, color: C.muted }}>
          <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: "#33454e" }}>{rows.length}</span>건 표시
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px" }}>
        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
          <Kpi label="오늘 알림 총 건수" value={String(wardAlerts.length)} unit="건" sub={`${ward}병동 · Total alerts`} color={C.ink} />
          <Kpi label="미확인 알림" value={String(unackedCount)} unit="건" sub="Awaiting acknowledge" color={C.dangerText} />
          <Kpi label="평균 확인 소요" value={avgAckLabel} unit="" sub="Mean time to acknowledge" color={C.tealDeep} />
        </div>

        {/* 테이블 */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>발생 시각</th>
                <th style={th}>상태</th>
                <th style={th}>환자 · 병실</th>
                <th style={th}>위험 항목</th>
                <th style={{ ...th, textAlign: "right" }}>측정치</th>
                <th style={th}>확인</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const roomShort = a.room.split(" ").slice(1).join(" ");
                return (
                  <tr key={a.id}>
                    <td style={{ ...td, fontFamily: FONT.mono, color: C.muted2 }}>{fmtClock(new Date(a.time))}</td>
                    <td style={td}><AckBadge acked={a.acked} /></td>
                    <td style={td}>
                      <span style={{ fontWeight: 700 }}>{a.name}</span>
                      <span style={{ color: C.muted4, fontSize: 12, marginLeft: 7 }}>{roomShort}</span>
                    </td>
                    <td style={{ ...td, color: "#54636c", fontWeight: 500 }}>{a.item}</td>
                    <td style={{ ...td, fontFamily: FONT.mono, fontWeight: 600, textAlign: "right", color: a.acked ? C.ink700 : C.dangerText }}>{a.value}</td>
                    <td style={{ ...td, color: C.muted2, fontSize: 12 }}>
                      {a.acked ? `${a.ackBy} · ${a.ackAt}` : <span style={{ color: C.faint }}>—</span>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: "center", color: C.muted3, padding: "28px 14px" }}>
                    해당 조건의 알림이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
