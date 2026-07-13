"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { validateLogin } from "@/lib/supabase/queries";
import { C, FONT } from "@/lib/theme";
import type { LoginUser } from "@/lib/types";
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
export function LoginScreen({ onLogin }: { onLogin: (user?: LoginUser) => void }) {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [ward, setWard] = useState("5·6");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!SUPABASE_ENABLED) {
      setError("서버(Supabase)가 구성되지 않았습니다. 관리자에게 문의하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await validateLogin(staffId.trim(), password);
      if (!user) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else if (user.wadCod && user.wadCod !== ward) {
        // 자격은 맞지만 선택한 병동이 계정의 담당 병동과 다름
        setError("선택한 병동이 계정 정보와 다릅니다.");
      } else {
        onLogin(user);
      }
    } catch {
      setError("서버 연결에 실패했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

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
          onSubmit={handleSubmit}
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

          {error && (
            <div role="alert" style={{ marginBottom: 12, padding: "8px 11px", borderRadius: 8, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText, fontSize: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="vw-btn"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "11px 0",
              border: "none",
              borderRadius: 9,
              background: submitting ? "#5fbdbd" : C.teal,
              color: "#fff",
              fontFamily: FONT.sans,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              boxShadow: "0 1px 2px rgba(18,166,166,.3)",
            }}
          >
            {submitting ? "로그인 중…" : "로그인"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 11, color: C.muted3 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            인증된 의료진만 접근 · 통신 구간 암호화(HTTPS)
          </div>
        </form>
      </div>
    </div>
  );
}
