"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { C, FONT } from "@/lib/theme";
import { WaveLogo } from "./icons";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: "#fff",
  fontFamily: FONT.sans,
  fontSize: 13.5,
  color: C.ink,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: C.muted,
  marginBottom: 5,
  letterSpacing: ".01em",
};

/**
 * 로그인 게이트 — 인증된 의료진만 관제 화면에 진입(요구사항 공통 인증·보안 3.9).
 * 데모라 실제 인증 없이 입력 후 로그인하면 통과한다.
 */
export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [ward, setWard] = useState("5·6");

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.navBg,
        padding: 20,
      }}
    >
      <div style={{ width: 380, maxWidth: "100%" }}>
        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 20, justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WaveLogo size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#eaf5f5", letterSpacing: "-.01em" }}>VitalWatch</div>
            <div style={{ fontSize: 11.5, color: "#7fb6b6", fontWeight: 500 }}>병동 실시간 관제 · Ward Central</div>
          </div>
        </div>

        {/* 카드 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
          style={{ background: "#fff", borderRadius: 14, padding: "26px 26px 22px", boxShadow: "0 12px 34px rgba(5,20,26,.4)" }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 3 }}>의료진 로그인</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>병동 관제 스테이션 접속</div>

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="login-id" style={labelStyle}>사번 / ID</label>
            <input
              id="login-id"
              className="vw-input"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="예: RN-2041"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="login-pw" style={labelStyle}>비밀번호</label>
            <input
              id="login-pw"
              className="vw-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-ward" style={labelStyle}>담당 병동</label>
            <select id="login-ward" className="vw-input" value={ward} onChange={(e) => setWard(e.target.value)} style={inputStyle}>
              <option value="5·6">5·6병동 (스테이션)</option>
              <option value="5">5병동</option>
              <option value="6">6병동</option>
            </select>
          </div>

          <button
            type="submit"
            className="vw-btn"
            style={{
              width: "100%",
              padding: "11px 0",
              border: "none",
              borderRadius: 9,
              background: C.teal,
              color: "#fff",
              fontFamily: FONT.sans,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(18,166,166,.3)",
            }}
          >
            로그인
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 11, color: C.muted3 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            인증된 의료진만 접근 · 통신 구간 암호화(HTTPS)
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#5c8a8a" }}>
          데모 — 아무 값이나 입력 후 로그인하면 관제 화면으로 이동합니다.
        </div>
      </div>
    </div>
  );
}
