"use client";

import { useEffect, useState } from "react";

import { VitalWatchApp } from "@/components/VitalWatchApp";

/**
 * 관제 화면은 전적으로 클라이언트 라이브 시뮬레이션이라, 마운트 전에는
 * 정적 셸만 렌더해 서버/클라이언트 첫 페인트를 일치시키고(하이드레이션 안전),
 * 마운트 후 실제 대시보드를 띄운다.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f2a33",
          color: "#7fb6b6",
          fontSize: 13,
          letterSpacing: ".02em",
        }}
      >
        VitalWatch · 관제 화면 준비 중…
      </div>
    );
  }

  return <VitalWatchApp />;
}
