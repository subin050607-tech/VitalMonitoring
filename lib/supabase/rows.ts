/** Supabase 뷰가 돌려주는 행(row) 타입. 모두 문자열 위주(앱 관례). */

export interface PatientSearchRow {
  pat_nam: string | null;
  pat_cht_num: string | null;
  pat_bthday: string | null;
  pat_gender: string | null;
  doctor_name: string | null;
  department_name: string | null;
  wad_nam: string | null;
  rom_nam: string | null;
  bed_nam: string | null;
  last_vital_check: string | null;
  kcd_nam: string | null;
  pat_typ: string | null;
  prg_stt: string | null;
  adm_dtm: string | null;
}

export interface VitalHistoryRow {
  cht_num: number;
  record_time: string | null;
  temperature: string | null;
  pulse: string | null;
  blood_pressure: string | null;
  respiration: string | null;
  spo2: string | null;
}

export interface AlarmListRow {
  alm_id: number;
  pat_nam: string | null;
  pat_cht_num: string | null;
  pat_bthday: string | null;
  pat_gender: string | null;
  wad_nam: string | null;
  department_name: string | null;
  doctor_name: string | null;
  kcd_nam: string | null;
  temperature: string | null;
  pulse: string | null;
  respiration: string | null;
  spo2: string | null;
  blood_pressure: string | null;
  create_dt: string | null;
  alm_msg: string | null;
}
