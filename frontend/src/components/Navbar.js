import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const displayName = user
    ? user.displayName || `${user.firstName} ${user.lastName}`
    : "User";

  const role = user?.role;

  function dashboardLink() {
    if (role === "admin") return "/admin/dashboard";
    if (role === "trainer") return "/trainer/dashboard";
    if (role === "trainee") return "/trainee/dashboard";
    return "/dashboard";
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={dashboardLink()}>FitFlow</Link>
      </div>
      <div className="navbar-links">
        <Link to={dashboardLink()}>Dashboard</Link>
        {role === "admin" && (
          <Link to="/admin/trainers">Trainers</Link>
        )}
        {role === "admin" && (
          <Link to="/admin/trainees">Trainees</Link>
        )}
        {role === "admin" && (
          <Link to="/admin/goals">Goals</Link>
        )}
        {role === "trainer" && (
          <Link to="/trainer/trainees">My Trainees</Link>
        )}
        {role === "trainer" && (
          <Link to="/trainer/exercises">Exercises</Link>
        )}
        {role === "trainee" && (
          <Link to="/trainee/workout-plan">Workout Plan</Link>
        )}
        {role === "trainee" && (
          <Link to="/trainee/tracking">Weekly Tracking</Link>
        )}
        {role === "trainee" && (
          <Link to="/trainee/nutrition">Nutrition</Link>
        )}
        <Link to="/settings">Settings</Link>
      </div>
      <div className="navbar-user">
        {role && <NotificationBell />}
        <span className="navbar-username">{displayName}</span>
        {role && <span className="role-badge">{role}</span>}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
