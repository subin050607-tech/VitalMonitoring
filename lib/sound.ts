/**
 * 위험 알림음. 애셋 파일 없이 Web Audio API 로 짧은 2단 비프를 낸다.
 * volume(0~100)에 비례해 크기 조절. AudioContext 는 사용자 제스처(로그인 클릭)
 * 이후 resume 되므로 실제로 소리가 난다.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 위험 알림 비프 재생. volume 0 이하이면 무음. */
export function playAlert(volume: number): void {
  if (volume <= 0) return;
  const ac = getCtx();
  if (!ac) return;
  const peak = Math.min(1, volume / 100) * 0.3; // 과하지 않게 상한
  const now = ac.currentTime;
  [880, 1175].forEach((freq, i) => {
    const t = now + i * 0.18;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  });
}
