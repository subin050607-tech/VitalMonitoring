"use client";

import { C, FONT } from "@/lib/theme";
import type { Toast } from "@/lib/types";
import { HoverButton } from "./HoverButton";
import { AlertTriangle } from "./icons";
import { PressButton } from "./PressButton";

export function ToastStack({
  toasts,
  onDismiss,
  onAck,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  onAck: (pid: string) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 66,
        right: 18,
        display: "flex",
        flexDirection: "column",
        gap: 9,
        zIndex: 60,
        width: 326,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: "auto",
            background: "#fff",
            border: "1px solid #f0b9b6",
            borderLeft: `4px solid ${C.danger}`,
            borderRadius: 10,
            boxShadow: "0 8px 22px rgba(20,40,55,.16)",
            padding: "11px 13px",
            animation: "vw-toastin .28s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.dangerText }}>
              <AlertTriangle size={14} strokeWidth={2.4} />
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".02em" }}>위험 알림 CRITICAL</span>
            </div>
            <PressButton
              onClick={() => onDismiss(t.id)}
              ariaLabel={`${t.name} 알림 닫기`}
              style={{ color: C.faint, fontSize: 15, lineHeight: 1, padding: "2px 4px" }}
            >
              ×
            </PressButton>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700 }}>{t.name}</span>
            <span style={{ fontSize: 11.5, color: C.muted4 }}>{t.room}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 10.5, color: C.muted2 }}>{t.time}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 11.5, color: "#54636c", fontWeight: 600 }}>{t.item}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 14, fontWeight: 600, color: C.dangerText }}>{t.value}</span>
          </div>

          <HoverButton
            onClick={() => onAck(t.pid)}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "6px 0",
              border: "1px solid #e6b0ad",
              borderRadius: 6,
              background: C.dangerBg,
              color: C.dangerDeep,
              fontFamily: FONT.sans,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
            hoverStyle={{ background: "#fbdedb" }}
          >
            확인 Acknowledge
          </HoverButton>
        </div>
      ))}
    </div>
  );
}
