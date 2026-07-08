"use client";

import type { CSSProperties } from "react";

import { C, FONT } from "@/lib/theme";
import type { Patient } from "@/lib/types";
import { AlertTriangle } from "../icons";
import { PressButton } from "../PressButton";
import { trackStyle, wardTab } from "../segStyles";
import { PatientCard } from "./PatientCard";

const roomShort = (p: Patient) => p.room.split(" ").slice(1).join(" ");

/** 정렬 우선순위: 위험<주의<정상, 같은 등급이면 미확인이 먼저. */
function priority(p: Patient): number {
  const rank = p.status === "danger" ? 0 : p.status === "caution" ? 1 : 2;
  const needsAck = p.status === "danger" && !p.acknowledged;
  return rank * 10 + (needsAck ? 0 : 1);
}

/** 위험/주의 요약 pill — 개수가 0이면 회색으로 죽인다. */
function summaryPill(active: boolean, activeStyle: CSSProperties): CSSProperties {
  const base: CSSProperties = { display: "flex", alignItems: "center", gap: 7, padding: "5px 13px", borderRadius: 8 };
  return active ? { ...base, ...activeStyle } : { ...base, background: C.normalBadgeBg, color: "#98a6af" };
}

const countNum: CSSProperties = { fontFamily: FONT.mono, fontWeight: 600, fontSize: 17 };
const countLabel: CSSProperties = { fontSize: 12, fontWeight: 600 };

export function Dashboard({
  patients,
  ward,
  setWard,
  onAck,
  onOpenDetail,
}: {
  patients: Patient[];
  ward: string;
  setWard: (w: string) => void;
  onAck: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const cards = [...patients].sort(
    (a, b) => priority(a) - priority(b) || roomShort(a).localeCompare(roomShort(b)),
  );
  const dangerCount = patients.filter((p) => p.status === "danger").length;
  const cautionCount = patients.filter((p) => p.status === "caution").length;
  const normalCount = patients.filter((p) => p.status === "normal").length;
  const unackCount = patients.filter((p) => p.status === "danger" && !p.acknowledged).length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 서브 헤더 */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 18, padding: "12px 20px", background: C.subBg, borderBottom: `1px solid ${C.borderSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".03em" }}>병동 Ward</span>
          <div style={trackStyle}>
            <PressButton onClick={() => setWard("5")} ariaPressed={ward === "5"} style={wardTab(ward === "5")}>5병동</PressButton>
            <PressButton onClick={() => setWard("6")} ariaPressed={ward === "6"} style={wardTab(ward === "6")}>6병동</PressButton>
          </div>
        </div>

        <div style={{ width: 1, height: 26, background: C.borderSoft }} />

        {/* 위험 요약 */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={summaryPill(dangerCount > 0, { background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}` })}>
            <AlertTriangle size={15} strokeWidth={2.3} />
            <span style={countNum}>{dangerCount}</span>
            <span style={countLabel}>위험</span>
          </div>
          <div style={summaryPill(cautionCount > 0, { background: C.cautionBg, color: C.cautionText, border: `1px solid ${C.cautionBorder}` })}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.caution }} />
            <span style={countNum}>{cautionCount}</span>
            <span style={countLabel}>주의</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: C.normalBadgeBg, color: "#4a5b64" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.normal }} />
            <span style={countNum}>{normalCount}</span>
            <span style={countLabel}>정상</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, color: C.muted }}>
          총 <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: "#33454e" }}>{patients.length}</span>명 모니터링 중 · 미확인 알림{" "}
          <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: C.danger }}>{unackCount}</span>건
        </div>
      </div>

      {/* 카드 그리드 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(372px,1fr))", gap: 14 }}>
          {cards.map((p) => (
            <PatientCard key={p.id} patient={p} onAck={onAck} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      </div>
    </div>
  );
}
