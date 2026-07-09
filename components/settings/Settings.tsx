"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { C, FONT } from "@/lib/theme";
import type { RangeKey, RangesConfig } from "@/lib/types";
import { DEFAULT_RANGES } from "@/lib/vitals";
import { CheckMark } from "../icons";
import { PressButton } from "../PressButton";

const VITAL_META: { key: RangeKey; label: string; unit: string; step: number }[] = [
  { key: "temp", label: "체온 Body Temp", unit: "°C", step: 0.1 },
  { key: "sbp", label: "수축기 혈압 SBP", unit: "mmHg", step: 1 },
  { key: "dbp", label: "이완기 혈압 DBP", unit: "mmHg", step: 1 },
  { key: "hr", label: "맥박 HR", unit: "bpm", step: 1 },
  { key: "rr", label: "호흡수 RR", unit: "/min", step: 1 },
  { key: "spo2", label: "산소포화도 SpO₂", unit: "%", step: 1 },
];

const th: CSSProperties = { textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".03em", padding: "9px 12px", borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "9px 12px", borderBottom: "1px solid #eef2f3" };
const numInput: CSSProperties = { width: 66, padding: "6px 8px", borderRadius: 7, border: `1px solid ${C.border}`, background: "#fff", fontFamily: FONT.mono, fontSize: 13, textAlign: "right", color: C.ink };

const card: CSSProperties = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" };
const sectionTitle = (title: string, eng: string) => (
  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
    {title} <span style={{ color: C.muted2, fontWeight: 500, fontSize: 12 }}>{eng}</span>
  </div>
);

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f1f4f5" }}>
      <span style={{ fontSize: 12.5, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{value}</span>
    </div>
  );
}

export function Settings({
  ranges,
  setRanges,
  soundOn,
  volume,
  setSound,
  setVolume,
}: {
  ranges: RangesConfig;
  setRanges: (r: RangesConfig) => void;
  soundOn: boolean;
  volume: number;
  setSound: (on: boolean) => void;
  setVolume: (v: number) => void;
}) {
  const [draft, setDraft] = useState<RangesConfig>(ranges);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(ranges);

  const setBound = (key: RangeKey, field: "normal" | "caution", idx: 0 | 1, val: number) => {
    setSaved(false);
    setDraft((d) => {
      const pair: [number, number] = [d[key][field][0], d[key][field][1]];
      pair[idx] = val;
      return { ...d, [key]: { ...d[key], [field]: pair } };
    });
  };

  const save = () => {
    setRanges(draft);
    setSaved(true);
  };
  const restore = () => {
    setDraft(DEFAULT_RANGES);
    setSaved(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: C.subBg, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          설정 <span style={{ color: C.muted2, fontWeight: 500, fontSize: 12.5 }}>Settings</span>
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 위험 기준치 */}
        <div style={card}>
          <div style={{ marginBottom: 4 }}>
            {sectionTitle("위험 기준치", "Critical thresholds")}
            <div style={{ fontSize: 11.5, color: C.muted3 }}>정상·주의 경계값을 조정하면 관제 판정에 즉시 반영됩니다 (요구사항 3.13).</div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={th}>항목</th>
                  <th style={{ ...th, textAlign: "right" }}>정상 하한</th>
                  <th style={{ ...th, textAlign: "right" }}>정상 상한</th>
                  <th style={{ ...th, textAlign: "right" }}>주의 하한</th>
                  <th style={{ ...th, textAlign: "right" }}>주의 상한</th>
                  <th style={th}>단위</th>
                </tr>
              </thead>
              <tbody>
                {VITAL_META.map((m) => {
                  const r = draft[m.key];
                  return (
                    <tr key={m.key}>
                      <td style={{ ...td, fontSize: 13, fontWeight: 600, color: C.ink }}>{m.label}</td>
                      {(["normal", "caution"] as const).flatMap((field) =>
                        ([0, 1] as const).map((idx) => (
                          <td key={`${field}-${idx}`} style={{ ...td, textAlign: "right" }}>
                            <input
                              className="vw-input"
                              type="number"
                              step={m.step}
                              value={r[field][idx]}
                              onChange={(e) => setBound(m.key, field, idx, Number(e.target.value))}
                              aria-label={`${m.label} ${field === "normal" ? "정상" : "주의"} ${idx === 0 ? "하한" : "상한"}`}
                              style={numInput}
                            />
                          </td>
                        )),
                      )}
                      <td style={{ ...td, fontSize: 12, color: C.muted2, fontFamily: FONT.mono }}>{m.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 액션 바 (하단 — 우상단 토스트 영역과 겹치지 않도록) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.borderSoft}` }}>
            {saved && !dirty && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.normal, fontWeight: 600, marginRight: "auto" }}>
                <CheckMark size={14} stroke={C.normal} /> 저장됨 · 관제에 반영되었습니다
              </span>
            )}
            {dirty && <span style={{ fontSize: 11.5, color: C.cautionText, marginRight: "auto" }}>저장하지 않은 변경이 있습니다</span>}
            <PressButton onClick={restore} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12.5, fontWeight: 600, color: C.muted, background: "#fff" }}>
              기본값 복원
            </PressButton>
            <PressButton
              onClick={save}
              style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: dirty ? C.teal : "#a9c9c9", cursor: dirty ? "pointer" : "default", boxShadow: dirty ? "0 1px 2px rgba(18,166,166,.3)" : "none" }}
            >
              저장
            </PressButton>
          </div>
        </div>

        {/* 계정 + 알림 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={card}>
            {sectionTitle("계정", "Account")}
            <div style={{ marginTop: 8 }}>
              <AccountRow label="이름" value="이정민" />
              <AccountRow label="역할" value="간호사 · RN" />
              <AccountRow label="소속" value="5·6병동 스테이션" />
              <AccountRow label="사번" value="RN-2041" />
            </div>
          </div>

          <div style={card}>
            {sectionTitle("알림", "Notifications")}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f4f5" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>청각 경고음</div>
                  <div style={{ fontSize: 11, color: C.muted3 }}>위험 알림 발생 시 소리 재생</div>
                </div>
                <PressButton
                  onClick={() => setSound(!soundOn)}
                  ariaPressed={soundOn}
                  ariaLabel="청각 경고음 토글"
                  style={{ width: 44, height: 24, borderRadius: 999, background: soundOn ? C.teal : "#cfd8dc", position: "relative", transition: "background .15s", flex: "none" }}
                >
                  <span style={{ position: "absolute", top: 2, left: soundOn ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.2)", transition: "left .15s" }} />
                </PressButton>
              </div>
              <div style={{ padding: "12px 0 2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.muted, marginBottom: 8 }}>
                  <span>알림음 볼륨</span>
                  <span style={{ fontFamily: FONT.mono, color: C.ink700, fontWeight: 600 }}>{soundOn ? `${volume}%` : "—"}</span>
                </div>
                <input
                  className="vw-input"
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  disabled={!soundOn}
                  aria-label="알림음 볼륨"
                  style={{ width: "100%", accentColor: C.teal, opacity: soundOn ? 1 : 0.4 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
