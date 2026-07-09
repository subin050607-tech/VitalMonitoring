# Supabase 스키마 복구 (VitalSigns ↔ VitalWatch 공유 DB)

드롭된 Supabase 테이블을 **VitalSigns(.NET MAUI 앱) 소스코드에서 역설계**해 재구성한 SQL. 모바일 앱을 수정 없이 그대로 작동시키고, 웹(vitalwatch)도 같은 뷰를 읽어 붙일 수 있는 단일 DB를 만든다.

- `recover_schema.sql` — 테이블 12(+`p_vtlack` 확인) + 뷰 6 + 인덱스 + 권한 + Realtime
- `recover_seed.sql` — 최소 데모 데이터(환자 8명, 오늘자 바이탈/알림, 미측정·위험 사례 포함)
- `recover_rls.sql` — RLS 활성 + 정책(읽기 anon 허용 / 쓰기는 `p_vtlinf`·`p_alminf`·`p_vtlack`만)

> **검증됨**: 로컬 Postgres 16에서 schema→seed→뷰 조회까지 전부 통과. 6개 뷰 모두 모바일 앱 모델이 기대하는 컬럼·행을 정확히 반환하는 것을 확인.

## 적용 방법 (택 1)

대상 프로젝트: `snazttuhmwmpttdfaifo`

### A. Supabase 대시보드 SQL Editor (가장 쉬움)
1. 대시보드 → SQL Editor
2. `recover_schema.sql` 전체 붙여넣기 → Run
3. `recover_seed.sql` 전체 붙여넣기 → Run
4. `recover_rls.sql` 전체 붙여넣기 → Run (보안 잠금 — 생략하면 예전처럼 열린 상태)

### B. Supabase CLI
```bash
supabase login                       # 최초 1회
supabase link --project-ref snazttuhmwmpttdfaifo
# DB 연결 문자열로 직접 실행 (대시보드 → Project Settings → Database → Connection string)
psql "$SUPABASE_DB_URL" -f supabase/recover_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/recover_seed.sql
```
(psql 이 없으면 방법 A 사용. `supabase db push` 는 migrations 디렉터리 구조가 필요하므로 여기선 직접 실행이 간단.)

## 로그인 계정 (시드)
| ID | PW | 부서 |
|---|---|---|
| `admin` | `1234` | 내과 |
| `nurse1` | `1234` | 내과 |

비밀번호는 `SHA256(소문자 hex, 솔트 없음)` — 앱의 `PasswordHasher` 와 동일.

## ⚠️ 반드시 확인할 것

1. **신뢰도 차이 (schema 파일 헤더 참고)**
   - 🟢 확실: `m_uidmst m_depmst m_wadmst m_kcdmst p_vtlinf p_alminf` (앱 `[Table]`/`[Column]` 매핑 존재)
   - 🟡 추정: `p_patinf p_cominf p_cowinf m_bedmst m_rommst` + 모든 `v_*` 뷰. 앱에 매핑이 없어 뷰 출력·속성명으로 역추정. JOIN 로직(부서=담당의 소속 등)은 가정이 들어감 → 실제 운영과 다르면 `-- [추정]` 주석 부분을 조정.

2. **바이탈 시각 포맷**: 앱은 `VtlUpdDtf` 를 `"yyyy-MM-dd␣␣HH:mm"`(공백 2칸, 12h `hh`)로 저장한다. 뷰는 공백 정규화 + `to_timestamp(...,'YYYY-MM-DD HH24:MI')` 로 파싱. 실제 저장값이 다르면 `v_vital_history` / `v_alarm_list` 의 파싱 포맷을 맞출 것.

3. **보안**: `recover_rls.sql` 을 적용하면 RLS 가 켜지고, **읽기는 anon 허용 / 쓰기는 `p_vtlinf`·`p_alminf`·`p_vtlack` 만** 으로 잠긴다(마스터·환자·입원 테이블 무단 변조 차단). 다만 두 앱이 Supabase Auth 가 아니라 자체 로그인(m_uidmst)을 쓰므로 **anon 키로 환자정보 "읽기"는 여전히 가능**하다. 완전 보안은 (A) 웹을 서버측 service_role 로 옮기고 (B) 모바일을 Supabase Auth 로 전환해야 한다. 자세한 설계·한계는 `recover_rls.sql` 헤더 참고.

4. **확인(Acknowledge) — `p_vtlack`**: 웹의 위험확인은 이 테이블에 **측정 1건당 1행**으로 저장된다. 그래서 여러 관제 PC 가 확인 상태를 공유하고, 새 측정이 들어오면 다시 미확인이 되어 재악화 시 알림이 다시 뜬다. (모바일 앱은 확인 기능이 없어 이 테이블을 쓰지 않음.)

## 웹(vitalwatch) 연결 — 다음 단계
웹 대시보드는 이 뷰들을 읽어 붙인다:
- `v_dashboard_risk` → 실시간 관제 위험 카드
- `v_patient_search` → 환자 목록
- `v_vital_history` → 환자 상세 추세
- `v_alarm_list` → 알림 이력

웹은 `hooks/useVitalWatchLive.ts` 에서 이 뷰들을 조회하고 `p_vtlinf`/`p_alminf`/`p_vtlack` INSERT 를 Realtime 구독한다(라이브 전용). `.env.local` 에 URL·anon 키만 넣으면 붙는다.
