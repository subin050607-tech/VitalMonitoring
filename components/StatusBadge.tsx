import { C } from "@/lib/theme";
import type { Status } from "@/lib/types";
import { AlertTriangle } from "./icons";

/** 위험/주의/정상 상태 배지. 카드·목록·이력에서 공통으로 쓴다. */
export function StatusBadge({ st }: { st: Status }) {
  if (st === "danger") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: C.danger, color: "#fff" }}>
        <AlertTriangle size={13} strokeWidth={2.4} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".02em" }}>위험 CRITICAL</span>
      </div>
    );
  }
  if (st === "caution") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: C.cautionBgAlt, color: C.cautionDeep, border: `1px solid ${C.cautionBorder}` }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.caution }} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".02em" }}>주의 WATCH</span>
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: C.normalBadgeBg, color: "#54636c" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.normal }} />
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".02em" }}>정상 STABLE</span>
    </div>
  );
}
