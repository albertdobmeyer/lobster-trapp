import { Routes, Route } from "react-router-dom";
import { useManifests } from "@/hooks/useManifests";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ComponentDetail from "@/pages/ComponentDetail";
import Settings from "@/pages/Settings";

export default function App() {
  const { components, loading, refresh } = useManifests();

  return (
    <Routes>
      <Route element={<Layout components={components} />}>
        <Route
          index
          element={
            <Dashboard
              components={components}
              loading={loading}
              onRefresh={refresh}
            />
          }
        />
        <Route
          path="/component/:id"
          element={<ComponentDetail components={components} />}
        />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
