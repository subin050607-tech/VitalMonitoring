/**
 * 결정론적 난수 유틸.
 *
 * 시뮬레이션 데이터가 서버 렌더와 클라이언트에서 동일하게 재현되도록,
 * 시드 기반 PRNG(mulberry32)와 문자열 해시(FNV-1a)를 쓴다.
 * (Math.random 은 라이브 지터에서만, 마운트 이후에 사용한다.)
 */

/** 시드 하나로 [0,1) 난수를 재현 가능하게 뽑는 mulberry32 PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 문자열 → 32bit 정수 시드 (FNV-1a). 차트별 안정적인 시드 생성에 쓴다. */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
