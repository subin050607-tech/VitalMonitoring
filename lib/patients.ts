/**
 * 데모용 병동 환자 시드 데이터 생성.
 *
 * 실제 서비스에서는 모바일 앱 → 서버 → 실시간 채널로 들어올 데이터를,
 * 여기서는 결정론적 PRNG 로 생성해 백엔드 없이 화면을 시연할 수 있게 한다.
 * (실시간 소스가 준비되면 이 모듈을 그대로 교체하면 된다.)
 */

import { fmtClock } from "./format";
import { mulberry32 } from "./rng";
import type { Patient, Toast, Vitals } from "./types";
import { DEFAULT_RANGES, patientStatus } from "./vitals";

const NAMES_5 = [
  "김서준", "이하윤", "박도현", "최유나", "정민재", "서지안", "윤재호",
  "한소율", "오건우", "임채원", "강태현", "조예린", "신우진", "권나연",
  "황선호", "안다인", "류정우", "문가은", "배승민", "홍지후",
];
const NAMES_6 = [
  "남기훈", "전보라", "고은성", "노아영", "도현수", "명지원", "반태오",
  "성유빈", "손하람", "양지훈", "엄서아", "예준석", "우민경", "장도경",
];

/** 특정 환자에게 인위적으로 위험/주의 바이탈을 심는 스펙. */
interface RiskSpec {
  kind: "spo2" | "temp" | "bp" | "hr";
  sev: "danger" | "caution";
  acked?: boolean;
}

const RISK_5: Record<number, RiskSpec> = {
  0: { kind: "spo2", sev: "danger" }, // 위험 · 미확인
  3: { kind: "bp", sev: "danger", acked: true }, // 위험 · 확인됨
  6: { kind: "temp", sev: "caution" },
  10: { kind: "bp", sev: "caution" },
  14: { kind: "hr", sev: "caution" },
};
const RISK_6: Record<number, RiskSpec> = {
  1: { kind: "temp", sev: "danger" }, // 위험 · 미확인 (발열/패혈 의심)
  5: { kind: "spo2", sev: "caution" },
  9: { kind: "bp", sev: "caution" },
};

/** 위험 스펙을 바이탈에 적용하고, 확인 표시가 필요하면 확인 정보를 채운다. */
function applyRisk(p: Patient, r: RiskSpec, now: number): void {
  const v = p.v;
  const danger = r.sev === "danger";
  if (r.kind === "spo2") {
    v.spo2 = danger ? 88 : 94;
    if (danger) {
      v.hr = 118;
      v.rr = 24;
    }
  } else if (r.kind === "temp") {
    v.temp = danger ? 39.2 : 38.1;
    if (danger) {
      v.hr = 114;
      v.rr = 23;
      v.spo2 = 93;
    }
  } else if (r.kind === "bp") {
    if (danger) {
      v.sbp = 172;
      v.dbp = 104;
      v.hr = 63;
    } else {
      v.sbp = 147;
      v.dbp = 93;
    }
  } else if (r.kind === "hr") {
    v.hr = danger ? 126 : 106;
  }
  if (r.acked) {
    p.acknowledged = true;
    p.ackBy = "이정민";
    p.ackAt = fmtClock(new Date(now - 360000));
  }
}

/**
 * 5·6병동 환자 목록을 생성한다.
 * @param now 측정·확인 시각 기준이 되는 현재 epoch ms.
 */
export function genPatients(now: number): Patient[] {
  const rand = mulberry32(20260706);
  let cno = 1042300;

  const build = (names: string[], ward: string, riskMap: Record<number, RiskSpec>): Patient[] =>
    names.map((name, i) => {
      const firstRoom = ward === "5" ? 501 : 601;
      const room = `${ward}병동 ${firstRoom + Math.floor(i / 2)}호`;
      const age = 34 + Math.floor(rand() * 52);
      const sex = rand() > 0.5 ? "남 M" : "여 F";
      // 난수 호출 순서(temp→sbp→dbp→hr→rr→spo2→cno→measured)는 시안과 동일하게 유지.
      const v: Vitals = {
        temp: +(36.3 + rand() * 0.7).toFixed(1),
        sbp: Math.round(110 + rand() * 18),
        dbp: Math.round(68 + rand() * 12),
        hr: Math.round(66 + rand() * 22),
        rr: Math.round(14 + rand() * 4),
        spo2: Math.round(96 + rand() * 4),
      };
      cno += 1 + Math.floor(rand() * 40);
      const p: Patient = {
        id: `${ward}-${i}`,
        ward,
        name,
        chartNo: `No.${cno}`,
        room,
        ageSex: `${age}세 · ${sex}`,
        v,
        status: "normal",
        measured: now - Math.floor(rand() * 40000),
        acknowledged: false,
        ackBy: "",
        ackAt: "",
      };
      const risk = riskMap[i];
      if (risk) applyRisk(p, risk, now);
      p.status = patientStatus(DEFAULT_RANGES, p.v);
      return p;
    });

  return [...build(NAMES_5, "5", RISK_5), ...build(NAMES_6, "6", RISK_6)];
}

/** 초기 토스트 — 5병동의 미확인 위험 환자 1명을 실시간 알림으로 띄운다. */
export function seedToasts(patients: Patient[], now: number): Toast[] {
  const d = patients.find((p) => p.ward === "5" && p.status === "danger" && !p.acknowledged);
  if (!d) return [];
  return [
    {
      id: `seed-${d.id}`,
      pid: d.id,
      name: d.name,
      room: d.room,
      item: "SpO₂ 산소포화도",
      value: `${d.v.spo2}%`,
      time: fmtClock(new Date(now)),
    },
  ];
}
