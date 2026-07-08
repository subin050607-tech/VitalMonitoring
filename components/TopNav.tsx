"use client";

import { C, FONT } from "@/lib/theme";
import type { ScreenName } from "@/lib/types";
import { WaveLogo } from "./icons";
import { PressButton } from "./PressButton";
import { navTab } from "./segStyles";

const TABS: { key: ScreenName; label: string }[] = [
  { key: "dashboard", label: "실시간 관제" },
  { key: "patients", label: "환자 목록" },
  { key: "stats", label: "병동 통계" },
  { key: "alerts", label: "알림 이력" },
  { key: "settings", label: "설정" },
];

export function TopNav({
  screen,
  goScreen,
  clock,
  onLogout,
}: {
  screen: ScreenName;
  goScreen: (s: ScreenName) => void;
  clock: string;
  onLogout: () => void;
}) {
  return (
    <div
      style={{
        height: 56,
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 20px",
        background: C.navBg,
        color: "#eaf5f5",
        borderBottom: `1px solid ${C.navBorder}`,
        zIndex: 40,
      }}
    >
      {/* 로고 */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: C.teal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WaveLogo size={16} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.01em" }}>VitalWatch</div>
        <div style={{ fontSize: 11, color: "#7fb6b6", fontWeight: 500, paddingLeft: 2 }}>
          병동 실시간 관제 · Ward Central
        </div>
      </div>

      {/* 화면 탭 */}
      <div style={{ display: "flex", gap: 2, background: C.navTrack, padding: 3, borderRadius: 9, marginLeft: 8 }}>
        {TABS.map((t) => (
          <PressButton key={t.key} onClick={() => goScreen(t.key)} ariaPressed={screen === t.key} style={navTab(screen === t.key)}>
            {t.label}
          </PressButton>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* LIVE 시계 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontFamily: FONT.mono,
          fontSize: 13,
          color: "#bfe3e3",
          letterSpacing: ".02em",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.normalDot, animation: "vw-blink 1.6s infinite" }} />
        <span style={{ fontWeight: 500 }}>LIVE</span>
        <span style={{ color: "#5c8a8a" }}>·</span>
        <span>{clock}</span>
      </div>

      <div style={{ width: 1, height: 24, background: "#264148" }} />

      {/* 사용자 */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#12706f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 12,
            color: "#eafeff",
          }}
        >
          이정
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>
            이정민 <span style={{ color: "#7fb6b6", fontWeight: 500 }}>간호사 · RN</span>
          </div>
          <div style={{ fontSize: 10.5, color: "#6ba0a0" }}>5·6병동 스테이션</div>
        </div>
        <PressButton
          onClick={onLogout}
          ariaLabel="로그아웃"
          style={{ display: "flex", alignItems: "center", padding: 6, borderRadius: 7, color: "#7fb6b6", marginLeft: 2 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PressButton>
      </div>
    </div>
  );
}
