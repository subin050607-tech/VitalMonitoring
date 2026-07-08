"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

/**
 * 인라인 스타일만으로는 :hover 를 표현하기 어려워, 마우스 진입 시
 * hoverStyle 을 base 위에 덮어씌우는 작은 버튼 래퍼.
 */
export function HoverButton({
  style,
  hoverStyle,
  onClick,
  children,
}: {
  style: CSSProperties;
  hoverStyle: CSSProperties;
  onClick: () => void;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      className="vw-btn"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={hovered ? { ...style, ...hoverStyle } : style}
    >
      {children}
    </button>
  );
}
