"use client";

import { memo } from "react";
import type { CSSProperties } from "react";

import { fmtClock } from "@/lib/format";
import { C, FONT } from "@/lib/theme";
import type { Patient, RangesConfig, Status } from "@/lib/types";
import { statusColor, vStatus, worstBp } from "@/lib/vitals";
import { HoverButton } from "../HoverButton";
import { CheckMark, ChevronRight } from "../icons";
import { PressButton } from "../PressButton";
import { useRanges } from "../RangesContext";
import { StatusBadge } from "../StatusBadge";

/** 바이탈 셀 배경/보더 (상태별). */
function cellColors(st: Status): { bg: string; border: string } {
  if (st === "danger") return { bg: C.dangerBg, border: C.dangerBorder };
  if (st === "caution") return { bg: C.cautionBg, border: C.cautionBorder };
  return { bg: "#f5f8f9", border: "#e9eef0" };
}

interface VitalCell {
  eng: string;
  kor: string;
  val: string;
  unit: string;
  st: Status;
}

function vitalCells(ranges: RangesConfig, p: Patient): VitalCell[] {
  const v = p.v;
  return [
    { eng: "TEMP", kor: "체온", val: v.temp.toFixed(1), unit: "°C", st: vStatus(ranges, "temp", v.temp) },
    { eng: "BP", kor: "혈압", val: `${v.sbp}/${v.dbp}`, unit: "mmHg", st: worstBp(ranges, v) },
    { eng: "HR", kor: "맥박", val: String(v.hr), unit: "bpm", st: vStatus(ranges, "hr", v.hr) },
    { eng: "RR", kor: "호흡", val: String(v.rr), unit: "/min", st: vStatus(ranges, "rr", v.rr) },
    { eng: "SpO₂", kor: "산소", val: String(v.spo2), unit: "%", st: vStatus(ranges, "spo2", v.spo2) },
  ];
}

/** 카드 상태별 테두리 + 그림자 (미확인 위험은 펄스). */
function wrapStyle(st: Status, needsAck: boolean): CSSProperties {
  const base: CSSProperties = {
    background: C.cardBg,
    borderRadius: 13,
    padding: "14px 15px 12px",
  };
  if (needsAck) {
    return { ...base, border: `1.5px solid ${C.danger}`, boxShadow: "0 0 0 0 rgba(210,59,56,.4)", animation: "vw-pulse 2s infinite" };
  }
  if (st === "danger") return { ...base, border: "1.5px solid #eaa9a6", boxShadow: "0 1px 2px rgba(20,40,55,.06)" };
  if (st === "caution") return { ...base, border: `1px solid ${C.cautionBorder}`, boxShadow: "0 1px 2px rgba(20,40,55,.05)" };
  return { ...base, border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(20,40,55,.04)" };
}

/**
 * memo — 대시보드는 LIVE 시계 때문에 매초 부모가 리렌더되지만, 카드는 자기
 * 환자 객체(3틱마다 갱신)나 콜백이 바뀔 때만 다시 그리면 된다. 콜백은
 * useVitalWatch 에서 useCallback 으로 안정화돼 있어 shallow 비교가 잘 맞는다.
 */
export const PatientCard = memo(function PatientCard({
  patient,
  onAck,
  onOpenDetail,
}: {
  patient: Patient;
  onAck: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const ranges = useRanges();
  const st = patient.status;
  const needsAck = st === "danger" && !patient.acknowledged;
  const showAcked = st === "danger" && patient.acknowledged;
  const roomShort = patient.room.split(" ").slice(1).join(" ");
  const chartNo = patient.chartNo.replace("No.", "");
  const divider = st === "danger" ? "#f3d6d4" : st === "caution" ? C.cautionBorder : "#eaeef0";

  return (
    <div style={wrapStyle(st, needsAck)}>
      {/* 헤더: 상태 배지 + 병실/측정시각 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <StatusBadge st={st} />
        <div style={{ textAlign: "right", lineHeight: 1.25 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink700 }}>{roomShort}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10.5, color: C.muted2 }}>{fmtClock(new Date(patient.measured))}</div>
        </div>
      </div>

      {/* 이름 */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 11 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em", color: C.ink }}>{patient.name}</div>
          <div style={{ fontSize: 12, color: C.muted4 }}>{patient.ageSex}</div>
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted2 }}>Chart&nbsp;{chartNo}</div>
      </div>

      {/* 바이탈 5칸 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
        {vitalCells(ranges, patient).map((cell) => {
          const cc = cellColors(cell.st);
          const strong = cell.st !== "normal";
          return (
            <div
              key={cell.eng}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "7px 8px",
                borderRadius: 8,
                background: cc.bg,
                border: `1px solid ${cc.border}`,
              }}
            >
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".03em", color: C.muted3 }}>{cell.eng}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, margin: "1px 0" }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: strong ? 600 : 500, color: statusColor(cell.st) }}>{cell.val}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 9.5, color: "#98a6af" }}>{cell.unit}</span>
              </div>
              <div style={{ fontSize: 9.5, color: C.muted }}>{cell.kor}</div>
            </div>
          );
        })}
      </div>

      {/* 푸터: 상세 링크 + 확인 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 11, paddingTop: 9, borderTop: `1px solid ${divider}` }}>
        <PressButton
          onClick={() => onOpenDetail(patient.id)}
          ariaLabel={`${patient.name} 추세 상세 보기`}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: C.tealDeep }}
        >
          추세 상세 <ChevronRight size={12} />
        </PressButton>
        {needsAck && (
          <HoverButton
            onClick={() => onAck(patient.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 13px",
              border: "none",
              borderRadius: 7,
              background: C.danger,
              color: "#fff",
              fontFamily: FONT.sans,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(210,59,56,.3)",
            }}
            hoverStyle={{ background: C.dangerDeep }}
          >
            <CheckMark size={13} /> 확인 Acknowledge
          </HoverButton>
        )}
        {showAcked && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.muted }}>
            <CheckMark size={13} stroke={C.normal} /> 확인됨 · {patient.ackAt} · {patient.ackBy}
          </div>
        )}
      </div>
    </div>
  );
});
