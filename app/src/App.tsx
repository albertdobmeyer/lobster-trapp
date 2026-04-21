import { Navigate, Route, Routes } from "react-router-dom";
import { useManifests } from "@/hooks/useManifests";
import { useSettings } from "@/hooks/useSettings";
import { AppContextProvider } from "@/lib/AppContext";
import { ToastProvider } from "@/lib/ToastContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import ModeSwitcher from "@/components/ModeSwitcher";
import Dashboard from "@/pages/Dashboard";
import ComponentDetail from "@/pages/ComponentDetail";
import Settings from "@/pages/Settings";
import Setup from "@/pages/Setup";
import NotFound from "@/pages/NotFound";
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
  const { components, loading, refresh } = useManifests();

  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="text-neutral-500 text-sm">Loading...</div>
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

            {/* User mode — existing Layout + screens, Phase E.2 will rebuild the inner pages */}
            <Route element={<Layout components={components} />}>
              <Route
                index
                element={
                  mode === "developer" ? (
                    <Navigate to="/dev" replace />
                  ) : !settings.wizardCompleted ? (
                    <Navigate to="/setup" replace />
                  ) : (
                    <Dashboard
                      components={components}
                      loading={loading}
                      onRefresh={refresh}
                    />
                  )
                }
              />
              <Route
                path="/component/:id"
                element={
                  <ErrorBoundary fallbackTitle="Component failed to load">
                    <ComponentDetail components={components} loading={loading} />
                  </ErrorBoundary>
                }
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </ToastProvider>
    </AppContextProvider>
  );
}
