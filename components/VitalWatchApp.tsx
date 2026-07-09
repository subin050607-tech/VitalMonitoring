"use client";

import { useVitalWatchLive } from "@/hooks/useVitalWatchLive";
import { fmtClock } from "@/lib/format";
import { C } from "@/lib/theme";
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
  const vw = useVitalWatchLive();
  const { state } = vw;

  if (!state.authed) {
    return <LoginScreen onLogin={vw.login} />;
  }

  const wardPatients = state.patients.filter((p) => p.ward === state.ward);
  const selected = state.patients.find((p) => p.id === state.selectedId) ?? wardPatients[0];

  return (
    <RangesProvider value={state.ranges}>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
        <TopNav screen={state.screen} goScreen={vw.goScreen} clock={fmtClock(state.now)} onLogout={vw.logout} userName={state.user?.name} />

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
            series={vw.selectedSeries}
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
          <AlertHistory ward={state.ward} setWard={vw.setWard} records={vw.liveAlerts} />
        )}

        {state.screen === "settings" && (
          <Settings
            ranges={state.ranges}
            setRanges={vw.setRanges}
            soundOn={state.soundOn}
            volume={state.volume}
            setSound={vw.setSound}
            setVolume={vw.setVolume}
          />
        )}

        <ToastStack toasts={state.toasts} onDismiss={vw.dismissToast} onAck={vw.ackPatient} />
      </div>
    </RangesProvider>
  );
}
