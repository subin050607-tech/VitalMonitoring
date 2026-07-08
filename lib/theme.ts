/**
 * VitalWatch 디자인 토큰.
 *
 * 원본 Claude Design 시안(VitalWatch 관제.dc.html)의 색·폰트를 그대로 옮긴 값이다.
 * 시안이 인라인 hex 를 광범위하게 쓰기 때문에, 의미가 반복되는 색만 여기 모아
 * 이름으로 부르고(가독성), 한 번만 쓰이는 미세 그레이는 사용처에 인라인으로 둔다.
 */

/** next/font 가 주입하는 CSS 변수. 인라인 스타일에서 font-family 로 참조한다. */
export const FONT = {
  sans: "var(--font-plex-sans)",
  mono: "var(--font-plex-mono)",
} as const;

export const C = {
  // 표면 / 배경
  pageBg: "#eaeef0", // 앱 전체 크림-그레이 배경
  subBg: "#f4f7f8", // 서브 헤더 표면
  cardBg: "#ffffff",

  // 잉크(다크) — 데이터·구조·다크 네비
  ink: "#17242e", // 본문 텍스트
  navBg: "#0f2a33", // 다크 틸 상단 네비
  navBorder: "#0a1f26",
  navTrack: "#0a222a", // 네비 내 탭 트랙
  ink700: "#33454e",

  // 액션 액센트 — 틸
  teal: "#12a6a6",
  tealDeep: "#0d8a8a",

  // 경계선
  border: "#dde3e7",
  borderSoft: "#dbe2e6",

  // 상태색 — 위험(적)
  danger: "#d23b38",
  dangerText: "#c0322f",
  dangerDeep: "#b8302d",
  dangerBg: "#fdecea",
  dangerBorder: "#f3c9c6",

  // 상태색 — 주의(앰버)
  caution: "#d99413",
  cautionText: "#a8760a",
  cautionDeep: "#9a6a06",
  cautionBg: "#fbf5e8",
  cautionBgAlt: "#fbf1dd",
  cautionBorder: "#ecd9ad",

  // 상태색 — 정상(그린)
  normal: "#3aa268",
  normalDot: "#43d17f",
  normalBadgeBg: "#eef2f3",

  // 정상범위 음영(차트)
  bandFill: "#e4f1ec",
  bandLine: "#bfe0d2",

  // 중립 텍스트 스케일 (전부 텍스트 전용 토큰 — 보더/배경엔 안 씀).
  // 흰 배경 기준 WCAG AA(4.5:1) 이상으로 맞춘 값. 위계는 크기·굵기와 함께 유지.
  muted: "#55606a", // 6.4:1
  muted2: "#5c6771", // 5.8:1
  muted3: "#646f79", // 5.1:1
  muted4: "#4f5a62", // 7.1:1 — 이름 옆 나이/성별 등 강한 보조 텍스트
  faint: "#66727d", // 4.9:1 — 가장 옅은 tier(축 라벨·단위·off 칩), 서브헤더서도 4.5:1↑
} as const;

/** 바이탈 항목별 라인 컬러 (상세 그래프 · 레이어 칩). */
export const VITAL_COLORS = {
  temp: "#e07a1a",
  bp: "#7b52c4",
  hr: "#d23b6e",
  rr: "#2f8f8f",
  spo2: "#1f7fd0",
} as const;
