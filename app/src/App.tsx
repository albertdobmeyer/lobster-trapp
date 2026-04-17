import { Routes, Route, Navigate } from "react-router-dom";
import { useManifests } from "@/hooks/useManifests";
import { useSettings } from "@/hooks/useSettings";
import { AppContext } from "@/lib/AppContext";
import { ToastProvider } from "@/lib/ToastContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ComponentDetail from "@/pages/ComponentDetail";
import Settings from "@/pages/Settings";
import Setup from "@/pages/Setup";
import NotFound from "@/pages/NotFound";

export default function App() {
  const { settings, loaded: settingsLoaded, update: updateSettings } = useSettings();
  const { components, loading, refresh } = useManifests();

  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ settings, settingsLoaded, updateSettings }}>
    <ToastProvider>
    <ErrorBoundary>
      <Routes>
        {/* Setup wizard — outside Layout (no sidebar) */}
        <Route path="/setup" element={<Setup />} />

        {/* Main app — redirect to wizard if not completed */}
        <Route element={<Layout components={components} />}>
          <Route
            index
            element={
              !settings.wizardCompleted ? (
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
    </AppContext.Provider>
  );
}
