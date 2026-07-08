"use client";

import { createContext, useContext } from "react";

import type { RangesConfig } from "@/lib/types";
import { DEFAULT_RANGES } from "@/lib/vitals";

/**
 * 현재 적용 중인 위험 기준치를 트리에 흘려보낸다. 설정 화면에서 바꾸면
 * 카드 셀 색·상세 그래프 밴드·평균차트가 즉시 새 기준치를 반영한다.
 * (prop drilling 을 피하려고 context 사용.)
 */
const RangesContext = createContext<RangesConfig>(DEFAULT_RANGES);

export const RangesProvider = RangesContext.Provider;

export function useRanges(): RangesConfig {
  return useContext(RangesContext);
}
