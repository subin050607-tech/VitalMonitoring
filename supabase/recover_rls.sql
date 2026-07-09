-- ============================================================================
-- RLS (Row Level Security) — 실용적 최소 잠금
-- ----------------------------------------------------------------------------
-- recover_schema.sql (+ seed) 이후에 적용. 예전엔 RLS 가 없어 anon 키로 무엇이든
-- 읽고 쓸 수 있었다. 이 마이그레이션은 그걸 다음 원칙으로 조인다:
--
--   읽기(SELECT): anon 허용            ← 두 앱 모두 읽고, Realtime 도 SELECT 권한 필요
--   쓰기(INSERT): 아래 3개 테이블만 anon
--       · p_vtlinf  (모바일 바이탈 저장)
--       · p_alminf  (모바일 알람 생성)
--       · p_vtlack  (웹 위험확인)
--   그 외(마스터·환자·입원·병상)의 anon INSERT/UPDATE/DELETE 는 정책이 없어 차단.
--
-- ── 한계 (반드시 이해할 것) ────────────────────────────────────────────────
-- 이 앱들은 Supabase Auth 를 안 쓰고 자체 로그인(m_uidmst)을 한다. 그래서
-- 정책을 auth.uid() 같은 "누가" 로 세밀히 걸 수 없고, anon 역할 단위로만 나뉜다.
-- 즉 anon 키를 가진 사람은 여전히 환자정보를 "읽을" 수 있다(뷰는 소유자 권한으로
-- 돌아 base RLS 를 우회하기도 함). 완전한 보안은 둘 중 하나가 필요하다:
--   (A) 웹은 서버(Next.js route/RSC)에서 service_role 키로 접근하고, 브라우저엔
--       DB 키를 두지 않는다. + 모바일도 Supabase Auth 로그인으로 전환.
--   (B) 모바일을 Supabase Auth 로 옮겨 정책을 사용자/부서 단위로 건다.
-- 지금은 (모바일이 anon 키를 직접 쓰는 구조라) 위 최소 잠금이 현실적 상한이다.
-- 이 파일은 "쓰기 무단 변조 차단 + RLS 활성" 까지를 확보하는 스캐폴드다.
-- ============================================================================

-- 모든 테이블 RLS on + 읽기(SELECT) anon/authenticated 허용
do $$
declare t text;
begin
  foreach t in array array[
    'm_uidmst','m_depmst','m_wadmst','m_kcdmst','m_rommst','m_bedmst',
    'p_patinf','p_cominf','p_cowinf','p_vtlinf','p_alminf','p_vtlack','m_setmst'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists sel_all on %I', t);
    execute format('create policy sel_all on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- 쓰기(INSERT)는 실제 쓰기 경로 3개만 anon 허용
drop policy if exists ins_vitals on p_vtlinf;
create policy ins_vitals on p_vtlinf for insert to anon, authenticated with check (true);

drop policy if exists ins_alarms on p_alminf;
create policy ins_alarms on p_alminf for insert to anon, authenticated with check (true);

drop policy if exists ins_acks on p_vtlack;
create policy ins_acks on p_vtlack for insert to anon, authenticated with check (true);

-- 설정은 웹에서 저장(insert/update) 하므로 두 정책 모두 허용
drop policy if exists ins_set on m_setmst;
create policy ins_set on m_setmst for insert to anon, authenticated with check (true);
drop policy if exists upd_set on m_setmst;
create policy upd_set on m_setmst for update to anon, authenticated using (true) with check (true);

-- (마스터·환자·입원·병상 테이블은 INSERT/UPDATE/DELETE 정책이 없어 anon 쓰기 차단.
--  시드/관리 데이터는 SQL Editor(postgres 역할)로 넣으면 RLS 를 우회하므로 문제 없음.)
