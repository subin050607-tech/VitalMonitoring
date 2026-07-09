/** 알림 이력 레코드. Supabase v_alarm_list 행을 매핑해 채운다. */
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
