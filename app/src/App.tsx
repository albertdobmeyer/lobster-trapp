import { Navigate, Route, Routes } from "react-router-dom";
import { useManifests } from "@/hooks/useManifests";
import { useSettings } from "@/hooks/useSettings";
import { AppContextProvider } from "@/lib/AppContext";
import { ToastProvider } from "@/lib/ToastContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserLayout from "@/components/UserLayout";
import ModeSwitcher from "@/components/ModeSwitcher";
import Setup from "@/pages/Setup";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/user/Home";
import SecurityMonitor from "@/pages/user/SecurityMonitor";
import Discover from "@/pages/user/Discover";
import Preferences from "@/pages/user/Preferences";
import Help from "@/pages/user/Help";
import DevLayout from "@/layouts/DevLayout";
import DevOverview from "@/pages/dev/DevOverview";
import DevComponents from "@/pages/dev/DevComponents";
import DevComponentDetail from "@/pages/dev/DevComponentDetail";
import DevLogs from "@/pages/dev/DevLogs";
import DevManifests from "@/pages/dev/DevManifests";
import DevSecurity from "@/pages/dev/DevSecurity";
import DevAllowlist from "@/pages/dev/DevAllowlist";
import DevShellLevels from "@/pages/dev/DevShellLevels";
import DevPreferences from "@/pages/dev/DevPreferences";

export default function App() {
  const { settings, loaded: settingsLoaded, update: updateSettings } = useSettings();
  // Manifests are still discovered (used by dev mode + setup wizard); user mode no longer needs them at the top level.
  useManifests();

  if (!settingsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <div className="text-sm text-neutral-500">Loading...</div>
      </div>
    );
  }

  const mode = settings.mode;

  return (
    <AppContextProvider
      settings={settings}
      settingsLoaded={settingsLoaded}
      updateSettings={updateSettings}
    >
      <ToastProvider>
        <ErrorBoundary>
          <ModeSwitcher />
          <Routes>
            {/* Setup wizard — no layout, outside modes */}
            <Route path="/setup" element={<Setup />} />

            {/* Developer mode subtree — only active when mode === 'developer' */}
            {mode === "developer" ? (
              <Route path="/dev" element={<DevLayout />}>
                <Route index element={<DevOverview />} />
                <Route path="components" element={<DevComponents />} />
                <Route path="components/:id" element={<DevComponentDetail />} />
                <Route path="logs" element={<DevLogs />} />
                <Route path="manifests" element={<DevManifests />} />
                <Route path="security" element={<DevSecurity />} />
                <Route path="allowlist" element={<DevAllowlist />} />
                <Route path="shell-levels" element={<DevShellLevels />} />
                <Route path="preferences" element={<DevPreferences />} />
              </Route>
            ) : (
              <Route path="/dev/*" element={<Navigate to="/" replace />} />
            )}

            {/* User mode — UserLayout shell with five icon-sidebar routes */}
            <Route element={<UserLayout />}>
              <Route
                index
                element={
                  mode === "developer" ? (
                    <Navigate to="/dev" replace />
                  ) : !settings.wizardCompleted ? (
                    <Navigate to="/setup" replace />
                  ) : (
                    <Home />
                  )
                }
              />
              <Route path="/security" element={<SecurityMonitor />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/help" element={<Help />} />
              {/* Back-compat: /settings used to be the user-mode preferences route. */}
              <Route path="/settings" element={<Navigate to="/preferences" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </ToastProvider>
    </AppContextProvider>
  );
}
