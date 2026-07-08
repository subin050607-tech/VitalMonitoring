import type { CSSProperties } from "react";

import { C, FONT } from "@/lib/theme";

/**
 * 세그먼트 토글(탭·병동·기간)의 on/off 인라인 스타일.
 * 세 토글이 트랙 배경 위에 얹히는 pill 형태로 모양이 같아 한곳에 모은다.
 */

/** 상단 네비 화면 탭 — 켜지면 틸. */
export function navTab(on: boolean): CSSProperties {
  return {
    padding: "6px 13px",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: on ? 600 : 500,
    cursor: "pointer",
    background: on ? C.teal : "transparent",
    color: on ? "#fff" : "#8fc4c4",
  };
}

/** 병동(5·6) 토글 — 켜지면 다크 잉크. */
export function wardTab(on: boolean): CSSProperties {
  return {
    padding: "5px 14px",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: on ? 600 : 500,
    cursor: "pointer",
    background: on ? C.navBg : "transparent",
    color: on ? "#fff" : "#5b6b74",
  };
}

/** 기간(24h·7d·30d) 토글 — 다크 잉크 + 모노. */
export function periodTab(on: boolean): CSSProperties {
  return {
    padding: "5px 12px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: on ? 600 : 500,
    cursor: "pointer",
    background: on ? C.navBg : "transparent",
    color: on ? "#fff" : "#5b6b74",
    fontFamily: FONT.mono,
  };
}

/** 토글들이 얹히는 공통 트랙(옅은 배경 + 안쪽 패딩). */
export const trackStyle: CSSProperties = {
  display: "flex",
  gap: 3,
  background: "#e6ecef",
  padding: 3,
  borderRadius: 9,
};
