/**
 * 알림 이력 목데이터.
 *
 * 오늘 하루 발생한 위험 알림과 확인(Acknowledge) 기록을 결정론적으로 생성한다.
 * (운영 3.4 · 안전 3.14 — 확인 상태·확인자·확인시각 기록/관리.)
 * 실제 서비스에서는 서버의 알림 테이블을 조회해 채운다.
 */

import { fmtClock } from "./format";
import { hash, mulberry32 } from "./rng";
import type { Patient } from "./types";

export interface AlertRecord {
  id: string;
  time: number; // 발생 시각 (epoch ms)
  ward: string;
  name: string;
  room: string;
  item: string; // "SpO₂ 산소포화도"
  value: string; // "88%"
  acked: boolean;
  ackBy: string;
  ackAt: string; // HH:MM:SS
  ackAfterSec: number; // 발생→확인 소요(초). 미확인이면 0
}

const KINDS = [
  { item: "SpO₂ 산소포화도", values: ["88%", "90%", "89%", "91%", "87%"] },
  { item: "HR 맥박", values: ["126 bpm", "132 bpm", "45 bpm", "128 bpm", "138 bpm"] },
  { item: "BP 혈압", values: ["172/104", "168/98", "176/108", "88/54"] },
  { item: "체온 Body Temp", values: ["39.2℃", "38.7℃", "35.2℃", "39.6℃"] },
];
const ACKERS = ["이정민", "박준호", "최수아"];

/** 오늘 발생한 알림 기록을 시각 내림차순(최신 먼저)으로 생성한다. */
export function genAlerts(patients: Patient[], now: number, count = 26): AlertRecord[] {
  if (patients.length === 0) return [];
  const rng = mulberry32(hash("alerts-2026-07"));
  const out: AlertRecord[] = [];
  for (let i = 0; i < count; i++) {
    const p = patients[Math.floor(rng() * patients.length)];
    const k = KINDS[Math.floor(rng() * KINDS.length)];
    const value = k.values[Math.floor(rng() * k.values.length)];
    const age = Math.floor(rng() * 15 * 3600 * 1000); // 최대 15시간 전
    const time = now - age;
    const acked = age > 7 * 60 * 1000; // 7분보다 오래된 알림은 확인됨 처리
    const ackDelay = 20000 + Math.floor(rng() * 280000); // 20초 ~ 5분
    out.push({
      id: `al-${i}`,
      time,
      ward: p.ward,
      name: p.name,
      room: p.room,
      item: k.item,
      value,
      acked,
      ackBy: acked ? ACKERS[Math.floor(rng() * ACKERS.length)] : "",
      ackAt: acked ? fmtClock(new Date(time + ackDelay)) : "",
      ackAfterSec: acked ? Math.round(ackDelay / 1000) : 0,
    });
  }
  return out.sort((a, b) => b.time - a.time);
}
