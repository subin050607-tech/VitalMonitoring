"use client";

import { useVitalWatch } from "@/hooks/useVitalWatch";
import { useVitalWatchLive } from "@/hooks/useVitalWatchLive";
import { fmtClock } from "@/lib/format";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { C } from "@/lib/theme";

// 환경변수로 결정되는 모듈 상수 → 훅 선택이 렌더 간 안정적(훅 순서 규칙 준수).
const useVitalWatchData = SUPABASE_ENABLED ? useVitalWatchLive : useVitalWatch;
import { AlertHistory } from "./alerts/AlertHistory";
import { Dashboard } from "./dashboard/Dashboard";
import { PatientDetail } from "./detail/PatientDetail";
import { LoginScreen } from "./LoginScreen";
import { PatientList } from "./patients/PatientList";
import { RangesProvider } from "./RangesContext";
import { Settings } from "./settings/Settings";
import { WardStats } from "./stats/WardStats";
import { ToastStack } from "./ToastStack";
import { TopNav } from "./TopNav";

export function VitalWatchApp() {
  const vw = useVitalWatchData();
  const { state } = vw;

  if (!state.authed) {
    return <LoginScreen onLogin={vw.login} />;
  }

  const wardPatients = state.patients.filter((p) => p.ward === state.ward);
  const selected = state.patients.find((p) => p.id === state.selectedId) ?? wardPatients[0];

  return (
    <RangesProvider value={state.ranges}>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
        <TopNav screen={state.screen} goScreen={vw.goScreen} clock={fmtClock(state.now)} onLogout={vw.logout} />

        {state.screen === "dashboard" && (
          <Dashboard
            patients={wardPatients}
            ward={state.ward}
            setWard={vw.setWard}
            onAck={vw.ackPatient}
            onOpenDetail={(id) => vw.openDetail(id, "dashboard")}
          />
        )}

        {state.screen === "patients" && (
          <PatientList
            patients={wardPatients}
            ward={state.ward}
            setWard={vw.setWard}
            onOpenDetail={(id) => vw.openDetail(id, "patients")}
          />
        )}

        {state.screen === "detail" && selected && (
          <PatientDetail
            patient={selected}
            layers={state.layers}
            toggleLayer={vw.toggleLayer}
            period={state.period}
            setPeriod={vw.setPeriod}
            goBack={() => vw.goScreen(state.detailReturn)}
            backLabel={state.detailReturn === "patients" ? "목록으로" : "관제로"}
          />
        )}

        {state.screen === "stats" && (
          <WardStats
            patients={wardPatients}
            ward={state.ward}
            setWard={vw.setWard}
            alertToday={state.alertToday}
            dangerPatientsToday={state.dangerPatientsToday}
          />
        )}

        {state.screen === "alerts" && (
          <AlertHistory
            patients={state.patients}
            ward={state.ward}
            setWard={vw.setWard}
            alertToday={state.alertToday}
            records={vw.liveAlerts}
          />
        )}

        {state.screen === "settings" && <Settings ranges={state.ranges} setRanges={vw.setRanges} />}

        <ToastStack toasts={state.toasts} onDismiss={vw.dismissToast} onAck={vw.ackPatient} />
      </div>
    </RangesProvider>
  );
}
