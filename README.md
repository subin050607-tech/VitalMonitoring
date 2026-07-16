# VitalWatch · 병동 실시간 환자 바이탈 관제 대시보드

병동 간호사가 모바일 앱으로 측정·저장한 환자 바이탈을 **웹 관제 화면에서 실시간으로 통합 모니터링**하고, 위험 수치를 즉시 식별·확인(Acknowledge)하는 웹 대시보드입니다. (SW개발 Project 실무 과제 — 환자 바이탈 모니터링 시스템)

> **Supabase 라이브 전용**입니다. `.env.local` 에 프로젝트 URL·anon 키를 넣으면 실제 DB(뷰 + Realtime)를 읽습니다. 모바일 앱이 바이탈을 입력하면 새로고침 없이 대시보드가 갱신됩니다.

## 화면 (6)

| 화면 | 설명 | 요구사항 |
|---|---|---|
| 로그인 | 의료진 인증 게이트 | 공통 인증 · 보안 3.9 |
| 실시간 관제 | 병동별 환자 카드 · 위험 강조·정렬 · 확인 워크플로 · 토스트 알림 | FR-01 · FR-02 |
| 환자 목록 | 검색·상태 필터·정렬 로스터 → 상세 진입 | 과제제안서 |
| 환자 상세 | 바이탈 추세 그래프 · 정상범위 음영 · 기간·레이어 토글 | FR-03 |
| 병동 통계 | KPI · 시간대별 알림 · 상태 분포 · 평균 바이탈 | FR-04 |
| 알림 이력 | 위험 알림 발생/확인 감사 로그 | 운영 3.4 · 안전 3.14 |
| 설정 | 위험 기준치 실시간 편집 · 계정 · 알림음 | 유지보수성 3.13 |

## 위험 기준치 (FR-02)

맥박 40 이하 / 130 초과 · 체온 35.5 미만 / 37.5 초과 · 수축기혈압 90 미만 / 160 초과 · 산소포화도 90% 미만 등. 설정 화면에서 조정하면 관제 판정에 즉시 반영됩니다.

## 기술 스택

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **IBM Plex Sans / Mono** (`next/font`)
- 상태·라이브 연동: 커스텀 훅 `useVitalWatchLive` (Supabase 조회 + Realtime 구독)

## 개발

```bash
pnpm install
pnpm dev        # http://localhost:4300
```

## 구조

```
app/           # 레이아웃 · 폰트 · 진입 페이지(마운트 게이트)
components/     # 화면별 컴포넌트 (dashboard/ detail/ stats/ patients/ alerts/ settings/)
hooks/         # useVitalWatchLive — 상태 + Supabase 조회/Realtime
lib/           # 도메인 로직 (vitals 기준치 · patients · series · alerts · theme)
supabase/      # 스키마·시드·RLS (recover_schema.sql = 테이블·뷰·FK 정의 SoT)
docs/설계자료/  # 이 구현의 근거가 된 기획·설계 문서
```

## 설계 자료 (구현 근거)

이 프로젝트는 요구사항서·상세설계서·운영 시나리오 등 사전 설계 문서를 기반으로 구현했습니다.
구현 의도나 배경이 궁금하면 [`docs/설계자료/`](docs/설계자료/)를 참고하세요 —
과제제안서 · 요구사항서 · 수행계획서 · 상세설계서 · 운영 시나리오 · 발표자료가 모여 있습니다.
요구사항(FR-01~04)·데이터 설계(개체·관계·ERD)는 각각 위 화면 표와 `supabase/recover_schema.sql`에 대응됩니다.
