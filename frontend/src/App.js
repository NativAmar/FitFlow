import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "./services/authService";
import { getSettings } from "./services/settingsService";
import { applyTheme, getCachedTheme } from "./services/themeService";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import "./App.css";

function RootRedirect() {
  return (
    <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />
  );
}

function App() {
  useEffect(() => {
    const cached = getCachedTheme();
    if (cached) {
      applyTheme(cached);
    }

    if (!isAuthenticated()) {
      return;
    }

    let cancelled = false;

    async function loadThemeFromSettings() {
      try {
        const data = await getSettings();
        if (!cancelled) {
          applyTheme(data.theme || "light");
        }
      } catch {
        // Keep cached theme on fetch failure.
      }
    }

    loadThemeFromSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
