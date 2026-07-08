/** VitalWatch 도메인 타입. */

/** 환자 1인의 최신 바이탈 사인 한 세트. */
export interface Vitals {
  temp: number; // 체온 °C
  sbp: number; // 수축기 혈압 mmHg
  dbp: number; // 이완기 혈압 mmHg
  hr: number; // 맥박 bpm
  rr: number; // 호흡수 /min
  spo2: number; // 산소포화도 %
}

/** 바이탈 판정 상태. 위험 > 주의 > 정상 순으로 심각. */
export type Status = "danger" | "caution" | "normal";

/** 관제 대상 환자 1인. */
export interface Patient {
  id: string;
  ward: string; // "5" | "6"
  name: string;
  chartNo: string; // "No.1042317"
  room: string; // "5병동 501호"
  ageSex: string; // "58세 · 남 M"
  v: Vitals;
  status: Status;
  measured: number; // 최근 측정 시각 (epoch ms)
  acknowledged: boolean; // 위험 알림 확인 여부
  ackBy: string;
  ackAt: string;
}

/** 위험 발생 시 우상단에 뜨는 실시간 알림. */
export interface Toast {
  id: string;
  pid: string; // 대상 환자 id
  name: string;
  room: string;
  item: string; // "SpO₂ 산소포화도"
  value: string; // "88%"
  time: string; // HH:MM:SS
}

/** 상세 그래프에서 켜고 끄는 바이탈 레이어. */
export interface Layers {
  temp: boolean;
  bp: boolean;
  hr: boolean;
  rr: boolean;
  spo2: boolean;
}

export type ScreenName = "dashboard" | "patients" | "detail" | "stats" | "alerts" | "settings";
export type Period = "24h" | "7d" | "30d";
export type VitalKey = keyof Layers;

/** 한 바이탈 항목의 정상/주의 경계값. 설정 화면에서 편집 가능. */
export interface VitalRange {
  normal: [number, number];
  caution: [number, number];
}

/** 위험 기준치 전체 (6개 판정 축). sbp·dbp 는 혈압을 나눠 판정. */
export type RangesConfig = Record<"temp" | "sbp" | "dbp" | "hr" | "rr" | "spo2", VitalRange>;
export type RangeKey = keyof RangesConfig;

/** 상세 그래프용 실측 시계열 (시간 오름차순). times 와 각 배열의 인덱스가 대응. */
export interface VitalSeries {
  times: number[]; // 측정 시각 epoch ms
  temp: number[];
  sbp: number[];
  dbp: number[];
  hr: number[];
  rr: number[];
  spo2: number[];
}
