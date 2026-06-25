import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { getSettings } from "./services/settingsService";
import { applyTheme, getCachedTheme } from "./services/themeService";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTrainers from "./pages/AdminTrainers";
import AdminTrainees from "./pages/AdminTrainees";
import AdminGoals from "./pages/AdminGoals";
import TrainerDashboard from "./pages/TrainerDashboard";
import TrainerTrainees from "./pages/TrainerTrainees";
import TrainerExercises from "./pages/TrainerExercises";
import TrainerWorkoutPlans from "./pages/TrainerWorkoutPlans";
import TraineeDashboard from "./pages/TraineeDashboard";
import TraineeWorkoutPlan from "./pages/TraineeWorkoutPlan";
import TraineeWorkoutTracking from "./pages/TraineeWorkoutTracking";
import TrainerTraineeTracking from "./pages/TrainerTraineeTracking";
import TrainerNutritionPlans from "./pages/TrainerNutritionPlans";
import TraineeNutritionPlan from "./pages/TraineeNutritionPlan";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import "./App.css";

// Redirects authenticated users to their role-specific dashboard
function RoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <p className="loading">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "trainer")
    return <Navigate to="/trainer/dashboard" replace />;
  if (user.role === "trainee")
    return <Navigate to="/trainee/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  // Apply cached theme immediately; load per-user theme from settings after auth
  useEffect(() => {
    const cached = getCachedTheme();
    if (cached) applyTheme(cached);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadTheme() {
      try {
        const data = await getSettings();
        if (!cancelled) applyTheme(data.theme || "light");
      } catch {
        // keep cached theme on failure
      }
    }

    loadTheme();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Role-redirect: /dashboard dispatches to the right role page */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/trainers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminTrainers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/trainees"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminTrainees />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/goals"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminGoals />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Trainer */}
      <Route
        path="/trainer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Layout>
              <TrainerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/trainees"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Layout>
              <TrainerTrainees />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/exercises"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Layout>
              <TrainerExercises />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/trainees/:traineeId/workout-plans"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Layout>
              <TrainerWorkoutPlans />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/trainees/:traineeId/tracking"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Layout>
              <TrainerTraineeTracking />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/trainees/:traineeId/nutrition-plans"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Layout>
              <TrainerNutritionPlans />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Trainee */}
      <Route
        path="/trainee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["trainee"]}>
            <Layout>
              <TraineeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainee/workout-plan"
        element={
          <ProtectedRoute allowedRoles={["trainee"]}>
            <Layout>
              <TraineeWorkoutPlan />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainee/tracking"
        element={
          <ProtectedRoute allowedRoles={["trainee"]}>
            <Layout>
              <TraineeWorkoutTracking />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainee/nutrition"
        element={
          <ProtectedRoute allowedRoles={["trainee"]}>
            <Layout>
              <TraineeNutritionPlan />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Shared settings — any authenticated role */}
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

      {/* Root — redirect to dashboard (which in turn dispatches by role) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
