# Supabase 구축 요청 (핸드오프)

VitalSigns(모바일) + VitalWatch(웹)가 **하나의 Supabase DB**를 공유하도록 세팅해 주세요.
필요한 SQL은 이 레포(`subin050607-tech/VitalMonitoring`)의 **`supabase/`** 폴더에 다 있습니다.

## 해줄 일 — SQL 3개를 순서대로 실행

Supabase 대시보드 → **SQL Editor** 에서 아래 파일 내용을 **순서대로** 붙여넣고 Run:

1. **`supabase/recover_schema.sql`** — 테이블 12 + 뷰 6 + 인덱스 + Realtime
2. **`supabase/recover_seed.sql`** — 데모 데이터(환자 8명, 오늘자 바이탈/알림)
3. **`supabase/recover_rls.sql`** — 보안(RLS) 잠금

> 프로젝트가 **일시정지(paused)** 상태면 먼저 **Restore(복구)** 하고 실행.
> 새 프로젝트로 만들어도 됩니다(무료 티어 OK) — 만든 뒤 위 3개 실행.

## 끝나면 나한테 보내줄 것 (딱 2개)

대시보드 → **Project Settings → API** 에서:

- **Project URL** — 예: `https://xxxxxxxx.supabase.co`
- **anon / publishable key** — `sb_publishable_...` 또는 `eyJ...`(anon public)

> 이 두 개를 웹(`.env.local`)과 모바일 앱(`MauiProgram.cs`)에 넣으면 바로 붙습니다.
> **service_role(secret) 키는 보내지 마세요** — 공개 anon 키만 필요합니다.

## 제대로 됐는지 확인 (선택)

SQL Editor에서 `select * from v_dashboard_risk;` 실행 → 위험 환자 2명(최유나·남기훈)이 나오면 성공.
데모 로그인 계정: **`nurse1` / `1234`** (또는 `admin` / `1234`).

## 참고

- 바이탈은 `p_vtlinf`에 항목당 1행(EAV)으로 쌓이고, 뷰 `v_vital_history`가 합쳐 보여줍니다.
- **RLS 주의**: 3번(rls)을 돌리면 읽기는 anon 허용 / 쓰기는 바이탈·알림·확인 테이블만 허용됩니다.
  다만 자체 로그인(Supabase Auth 미사용) 구조라 anon 키로 **읽기는 열려** 있습니다.
  실서비스로 갈 거면 별도 보안 강화가 필요합니다(문서: `supabase/recover_rls.sql` 헤더).
- 자세한 적용법·주의는 `supabase/README.md` 참고.
