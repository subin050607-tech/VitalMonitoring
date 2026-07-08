-- ============================================================================
-- VitalSigns / VitalWatch 공유 Supabase 스키마 복구
-- ----------------------------------------------------------------------------
-- VitalSigns(.NET MAUI 모바일 앱)의 소스코드에서 역설계한 테이블·뷰 정의.
-- 목표: 모바일 앱을 수정 없이 그대로 작동시키고, 웹(vitalwatch)도 같은 뷰를
--       읽어 붙일 수 있는 단일 DB를 재구성한다.
--
-- 신뢰도
--   [확실] m_uidmst m_depmst m_wadmst m_kcdmst p_vtlinf p_alminf
--          → 앱에 [Table]/[Column] 매핑이 있어 이름·대소문자가 정확.
--   [추정] p_patinf p_cominf p_cowinf m_bedmst m_rommst + 모든 v_* 뷰
--          → 앱에 매핑이 없어 뷰 출력 컬럼과 속성명으로 역추정. JOIN 로직은
--            원본 DB에 있다가 사라져 최선 재구성(부서=담당의 소속 등 가정 포함).
--            "-- [추정]" 주석이 붙은 곳은 실제와 다를 수 있으니 검증할 것.
--
-- 주의
--   · 컬럼은 앱이 문자열로 읽는 관례에 맞춰 대부분 text (날짜=문자열, 바이탈=문자열).
--   · 기본 테이블은 [Column("PascalCase")] 를 그대로 살리려고 큰따옴표 식별자 사용.
--     (Postgres 는 따옴표 없는 식별자를 소문자로 접으므로 반드시 따옴표 필요.)
--   · 뷰는 소문자 snake_case 컬럼(앱의 뷰 모델 매핑과 일치).
--   · 보안: 아래 grant 는 예전 동작(publishable/anon 키로 직접 접근)을 그대로
--     재현한다. 즉 환자 개인정보가 anon 키로 열림. 실서비스 전 RLS 정책 필수.
-- ============================================================================

-- 재실행 안전: 뷰 먼저 제거(테이블 의존성)
drop view if exists v_dashboard_risk cascade;
drop view if exists v_dashboard_unchecked cascade;
drop view if exists v_alarm_list cascade;
drop view if exists v_patient_target_code cascade;
drop view if exists v_patient_search cascade;
drop view if exists v_vital_history cascade;

-- ────────────────────────────── 마스터 테이블 ──────────────────────────────

-- 사용자(의료진) [확실]
create table if not exists m_uidmst (
  "UidCod"    text primary key,
  "UidNam"    text,
  "UidDepCod" text,               -- 소속 부서 → m_depmst.DepCod
  "UidPwd"    text,               -- SHA256 소문자 hex (솔트 없음)
  "UidStrDte" text,               -- yyyyMMdd
  "UidEndDte" text                -- yyyyMMdd
);

-- 부서 [확실]  (주의: 컬럼명은 "DepName" 이고 모델 속성만 DepNam)
create table if not exists m_depmst (
  "DepCod"    text primary key,
  "DepName"   text,
  "DepStrDte" text,
  "DepEndDte" text
);

-- 병동 [확실]
create table if not exists m_wadmst (
  "WadCod"    text primary key,
  "WadNam"    text,
  "WadStrDte" text,
  "WadEndDte" text
);

-- 진단코드(KCD) [확실]
create table if not exists m_kcdmst (
  "KcdCod"    text primary key,
  "KcdNam"    text,
  "KcdStrDte" text,
  "KcdEndDte" text
);

-- 병실 [추정]  (BedInfo/RomInfo plain 모델 → 표준 명명으로 재구성)
create table if not exists m_rommst (
  "RomCod"    text primary key,
  "RomWadCod" text,
  "RomNam"    text,
  "RomStrDte" text,
  "RomEndDte" text
);

-- 병상 [추정]
create table if not exists m_bedmst (
  "BedCod"    text primary key,
  "BedWadCod" text,
  "BedRomCod" text,
  "BedNam"    text,
  "BedStrDte" text,
  "BedEndDte" text
);

-- ────────────────────────────── 데이터 테이블 ──────────────────────────────

-- 환자 기본정보 [추정]
create table if not exists p_patinf (
  "PatChtnum" integer primary key,   -- 차트번호
  "PatNam"    text,
  "PatResNum" text,                  -- 주민번호
  "PatBthday" text,
  "PatGender" text
);

-- 입퇴원/진료 접수 [추정]
create table if not exists p_cominf (
  "Comnum"    integer generated always as identity primary key,
  "ComChtNum" integer,               -- → p_patinf.PatChtnum
  "ComPatTyp" text,                  -- I(입원)/O(외래)
  "ComPrgStt" text,                  -- 진행상태 (ILV/OC 등)
  "ComAcpDtm" text,                  -- 접수(입원)일시  = adm_dtm
  "ComLevDtm" text,                  -- 퇴원일시
  "ComUidCod" text,                  -- 담당의 → m_uidmst.UidCod
  "ComKcdCod" text,                  -- 진단 → m_kcdmst.KcdCod
  "ComTrsDtm" text
);

-- 병상 배정 이력 [추정]
create table if not exists p_cowinf (
  "CowId"     bigint generated always as identity primary key,  -- 대리 PK(원본 PK 불명)
  "CowComNum" integer,               -- → p_cominf.Comnum
  "CowStrDtm" text,
  "CowEndDtm" text,
  "CowWadCod" text,                  -- → m_wadmst.WadCod
  "CowRomCod" text,                  -- → m_rommst.RomCod
  "CowBedCod" text,                  -- → m_bedmst.BedCod
  "CowUpdDtf" text,
  "CowUpdUid" text
);

-- 바이탈 기록 (EAV: 항목 1개당 1행) [확실] — 모바일 앱의 쓰기 대상
create table if not exists p_vtlinf (
  "id"        integer generated always as identity primary key,
  "VtlChtNum" integer,               -- → p_patinf.PatChtnum
  "VtlSign"   text,                  -- 체온 / 혈압 / 맥박 / 호흡수 / 산소포화도
  "VtlValue"  text,                  -- 값(문자열). 혈압은 "120/80"
  "VtlUpdDtf" text,                  -- "yyyy-MM-dd  HH:mm" (공백 2칸)
  "VtlUpdUid" text
);

-- 위험 알림 [확실] — 위험 분석 후 쓰기 대상, Realtime 구독 대상
create table if not exists p_alminf (
  "AlmId"        bigint generated always as identity primary key,
  "AlmChtNum"    integer,
  "AlmTyp"       text,               -- Critical / Alert / Warning
  "AlmMessage"   text,
  "AlmCreateDtf" text,               -- 발생일시
  "AlmCreateUid" text,
  "TargetDepCod" text,
  "TargetWadCod" text
);

-- 조회 성능용 인덱스
create index if not exists ix_vtlinf_cht_dtf on p_vtlinf ("VtlChtNum", "VtlUpdDtf");
create index if not exists ix_alminf_cht_dtf on p_alminf ("AlmChtNum", "AlmCreateDtf");
create index if not exists ix_cominf_cht_acp on p_cominf ("ComChtNum", "ComAcpDtm");
create index if not exists ix_cowinf_com_str on p_cowinf ("CowComNum", "CowStrDtm");

-- ────────────────────────────────── 뷰 ─────────────────────────────────────
-- 모두 [추정] — 출력 컬럼은 앱 모델과 정확히 일치하도록 맞췄고, JOIN 은 재구성.

-- 바이탈 이력(피벗): EAV p_vtlinf → 항목별 컬럼
create or replace view v_vital_history as
select
  "VtlChtNum"                                            as cht_num,
  -- 공백 정규화 후 timestamp 파싱. 앱 저장 포맷이 12h(hh)라 필요 시 조정.
  to_timestamp(regexp_replace(trim("VtlUpdDtf"), '\s+', ' ', 'g'), 'YYYY-MM-DD HH24:MI') as record_time,
  max("VtlValue") filter (where "VtlSign" = '체온')       as temperature,
  max("VtlValue") filter (where "VtlSign" = '맥박')       as pulse,
  max("VtlValue") filter (where "VtlSign" = '혈압')       as blood_pressure,
  max("VtlValue") filter (where "VtlSign" = '호흡수')     as respiration,
  max("VtlValue") filter (where "VtlSign" = '산소포화도') as spo2
from p_vtlinf
group by "VtlChtNum", "VtlUpdDtf";

-- 환자 검색: 환자 + 현재 입원(cominf) + 현재 병상(cowinf) + 마스터
create or replace view v_patient_search as
with cur_com as (
  select distinct on ("ComChtNum") *
  from p_cominf
  order by "ComChtNum", "ComAcpDtm" desc          -- 최근 입원 1건
),
cur_cow as (
  select distinct on ("CowComNum") *
  from p_cowinf
  order by "CowComNum", "CowStrDtm" desc           -- 최근 병상 1건
)
select
  p."PatNam"                          as pat_nam,
  p."PatChtnum"::text                 as pat_cht_num,
  p."PatBthday"                       as pat_bthday,
  p."PatGender"                       as pat_gender,
  doc."UidNam"                        as doctor_name,
  dep."DepName"                       as department_name,   -- [추정] 부서 = 담당의 소속
  w."WadNam"                          as wad_nam,
  r."RomNam"                          as rom_nam,
  b."BedNam"                          as bed_nam,
  (select max(v."VtlUpdDtf") from p_vtlinf v
     where v."VtlChtNum" = p."PatChtnum")          as last_vital_check,
  k."KcdNam"                          as kcd_nam,
  c."ComPatTyp"                       as pat_typ,
  c."ComPrgStt"                       as prg_stt,
  c."ComAcpDtm"                       as adm_dtm
from p_patinf p
left join cur_com  c   on c."ComChtNum" = p."PatChtnum"
left join cur_cow  cw  on cw."CowComNum" = c."Comnum"
left join m_uidmst doc on doc."UidCod"  = c."ComUidCod"
left join m_depmst dep on dep."DepCod"  = doc."UidDepCod"
left join m_kcdmst k   on k."KcdCod"    = c."ComKcdCod"
left join m_wadmst w   on w."WadCod"    = cw."CowWadCod"
left join m_rommst r   on r."RomCod"    = cw."CowRomCod"
left join m_bedmst b   on b."BedCod"    = cw."CowBedCod";

-- 환자의 현재 부서/병동 코드 (알림 타겟팅용)
create or replace view v_patient_target_code as
with cur_com as (
  select distinct on ("ComChtNum") * from p_cominf order by "ComChtNum", "ComAcpDtm" desc
),
cur_cow as (
  select distinct on ("CowComNum") * from p_cowinf order by "CowComNum", "CowStrDtm" desc
)
select
  c."ComChtNum"   as cht_num,
  doc."UidDepCod" as dep_cod,        -- [추정] 담당의 소속 부서
  cw."CowWadCod"  as wad_cod,
  c."ComAcpDtm"   as adm_dtm
from cur_com c
left join cur_cow  cw  on cw."CowComNum" = c."Comnum"
left join m_uidmst doc on doc."UidCod"  = c."ComUidCod";

-- 오늘 알림 목록 (환자·마스터·최근 바이탈 조인)
create or replace view v_alarm_list as
select
  a."AlmId"                                             as alm_id,
  p."PatNam"                                            as pat_nam,
  a."AlmChtNum"::text                                   as pat_cht_num,
  p."PatBthday"                                         as pat_bthday,
  p."PatGender"                                         as pat_gender,
  ps.wad_nam                                            as wad_nam,
  ps.department_name                                    as department_name,
  ps.doctor_name                                        as doctor_name,
  ps.kcd_nam                                            as kcd_nam,
  lv.temperature, lv.pulse, lv.respiration, lv.spo2, lv.blood_pressure,
  to_timestamp(regexp_replace(trim(a."AlmCreateDtf"), '\s+', ' ', 'g'), 'YYYY-MM-DD HH24:MI:SS') as create_dt,
  a."AlmMessage"                                        as alm_msg
from p_alminf a
left join p_patinf p        on p."PatChtnum" = a."AlmChtNum"
left join v_patient_search ps on ps.pat_cht_num = a."AlmChtNum"::text
left join lateral (
  select * from v_vital_history vh
  where vh.cht_num = a."AlmChtNum"
  order by vh.record_time desc nulls last
  limit 1
) lv on true;

-- 대시보드: 미측정(오늘 바이탈 없는 입원 환자) [추정 정의]
create or replace view v_dashboard_unchecked as
select *
from v_patient_search
where pat_typ = 'I'
  and coalesce(prg_stt, '') <> 'ILV'
  and (last_vital_check is null
       or left(last_vital_check, 10) < to_char(now(), 'YYYY-MM-DD'));

-- 대시보드: 위험(활성 알림 있는 환자) — Patient 컬럼 + 알림 정보
create or replace view v_dashboard_risk as
with last_alm as (
  select distinct on ("AlmChtNum") *
  from p_alminf
  order by "AlmChtNum", "AlmCreateDtf" desc
)
select
  ps.*,
  a."AlmTyp"     as alm_typ,
  a."AlmMessage" as alm_msg,
  to_timestamp(regexp_replace(trim(a."AlmCreateDtf"), '\s+', ' ', 'g'), 'YYYY-MM-DD HH24:MI:SS') as create_dt
from v_patient_search ps
join last_alm a on a."AlmChtNum"::text = ps.pat_cht_num;

-- ──────────────────────────────── 권한(grant) ──────────────────────────────
-- 예전 동작 재현: publishable/anon 키로 직접 접근. (보안 경고: 위 헤더 참고)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Realtime: 모바일(AlertService)은 p_alminf, 웹은 p_vtlinf/p_alminf INSERT 를 구독
alter publication supabase_realtime add table p_alminf;
alter publication supabase_realtime add table p_vtlinf;
