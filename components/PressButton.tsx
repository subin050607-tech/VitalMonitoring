"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * UA 기본 버튼 스타일을 지운 bare 버튼. 시안의 `div onClick` 컨트롤을
 * 외관은 그대로 두면서 키보드/포커스/스크린리더 접근성만 얹기 위한 래퍼.
 * (탭·병동·기간·레이어 토글, 상세 링크, 토스트 닫기 등에 사용)
 */

const RESET: CSSProperties = {
  appearance: "none",
  background: "transparent",
  border: "none",
  margin: 0,
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

export function PressButton({
  style,
  onClick,
  children,
  ariaLabel,
  ariaPressed,
}: {
  style?: CSSProperties;
  onClick: () => void;
  children: ReactNode;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      className="vw-btn"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      style={{ ...RESET, ...style }}
    >
      {children}
    </button>
  );
}
