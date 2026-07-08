"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { fmtClock } from "@/lib/format";
import { C, FONT } from "@/lib/theme";
import type { Patient, Status } from "@/lib/types";
import { statusColor, vStatus, worstBp } from "@/lib/vitals";
import { ChevronRight } from "../icons";
import { PressButton } from "../PressButton";
import { useRanges } from "../RangesContext";
import { StatusBadge } from "../StatusBadge";
import { trackStyle, wardTab } from "../segStyles";

type StatusFilter = "all" | Status;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "danger", label: "위험" },
  { key: "caution", label: "주의" },
  { key: "normal", label: "정상" },
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
const num: CSSProperties = { fontFamily: FONT.mono, fontSize: 13 };

function filterChip(on: boolean): CSSProperties {
  return {
    padding: "5px 12px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: on ? 600 : 500,
    cursor: "pointer",
    background: on ? C.navBg : "transparent",
    color: on ? "#fff" : "#5b6b74",
  };
}

const rank = (p: Patient) => (p.status === "danger" ? 0 : p.status === "caution" ? 1 : 2);

export function PatientList({
  patients,
  ward,
  setWard,
  onOpenDetail,
}: {
  patients: Patient[];
  ward: string;
  setWard: (w: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const ranges = useRanges();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const q = query.trim();
  const rows = patients
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => !q || p.name.includes(q) || p.chartNo.includes(q) || p.room.includes(q))
    .sort((a, b) => rank(a) - rank(b) || a.room.localeCompare(b.room));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
      {/* 서브 헤더 */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: C.subBg, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          환자 목록 <span style={{ color: C.muted2, fontWeight: 500, fontSize: 12.5 }}>Patient Roster</span>
        </span>
        <div style={trackStyle}>
          <PressButton onClick={() => setWard("5")} ariaPressed={ward === "5"} style={wardTab(ward === "5")}>5병동</PressButton>
          <PressButton onClick={() => setWard("6")} ariaPressed={ward === "6"} style={wardTab(ward === "6")}>6병동</PressButton>
        </div>

        <div style={{ position: "relative" }}>
          <input
            className="vw-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 · Chart No · 병실 검색"
            aria-label="환자 검색"
            style={{ width: 240, padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontFamily: FONT.sans, fontSize: 12.5, color: C.ink }}
          />
        </div>

        <div style={trackStyle}>
          {FILTERS.map((f) => (
            <PressButton key={f.key} onClick={() => setStatusFilter(f.key)} ariaPressed={statusFilter === f.key} style={filterChip(statusFilter === f.key)}>
              {f.label}
            </PressButton>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, color: C.muted }}>
          <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: "#33454e" }}>{rows.length}</span>명 표시
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px" }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>상태</th>
                <th style={th}>환자</th>
                <th style={th}>병실</th>
                <th style={th}>Chart No</th>
                <th style={{ ...th, textAlign: "right" }}>체온</th>
                <th style={{ ...th, textAlign: "right" }}>혈압</th>
                <th style={{ ...th, textAlign: "right" }}>맥박</th>
                <th style={{ ...th, textAlign: "right" }}>SpO₂</th>
                <th style={{ ...th, textAlign: "right" }}>측정</th>
                <th style={{ ...th, textAlign: "right" }} aria-label="상세" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const roomShort = p.room.split(" ").slice(1).join(" ");
                const tempSt = vStatus(ranges, "temp", p.v.temp);
                const bpSt = worstBp(ranges, p.v);
                const hrSt = vStatus(ranges, "hr", p.v.hr);
                const spo2St = vStatus(ranges, "spo2", p.v.spo2);
                return (
                  <tr key={p.id}>
                    <td style={td}><StatusBadge st={p.status} /></td>
                    <td style={td}>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ color: C.muted4, fontSize: 12, marginLeft: 7 }}>{p.ageSex}</span>
                    </td>
                    <td style={{ ...td, color: C.ink700, fontWeight: 500 }}>{roomShort}</td>
                    <td style={{ ...td, ...num, color: C.muted2 }}>{p.chartNo.replace("No.", "")}</td>
                    <td style={{ ...td, ...num, textAlign: "right", color: statusColor(tempSt) }}>{p.v.temp.toFixed(1)}</td>
                    <td style={{ ...td, ...num, textAlign: "right", color: statusColor(bpSt) }}>{p.v.sbp}/{p.v.dbp}</td>
                    <td style={{ ...td, ...num, textAlign: "right", color: statusColor(hrSt) }}>{p.v.hr}</td>
                    <td style={{ ...td, ...num, textAlign: "right", color: statusColor(spo2St) }}>{p.v.spo2}</td>
                    <td style={{ ...td, ...num, textAlign: "right", color: C.muted2 }}>{fmtClock(new Date(p.measured))}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <PressButton
                        onClick={() => onOpenDetail(p.id)}
                        ariaLabel={`${p.name} 추세 상세 보기`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: C.tealDeep }}
                      >
                        상세 <ChevronRight size={12} />
                      </PressButton>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: "center", color: C.muted3, padding: "28px 14px" }}>
                    조건에 맞는 환자가 없습니다.
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
