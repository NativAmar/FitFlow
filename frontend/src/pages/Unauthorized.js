import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getRoleHome(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "trainer") return "/trainer/dashboard";
  if (role === "trainee") return "/trainee/dashboard";
  return "/login";
}

function Unauthorized() {
  const { user, isAuthenticated } = useAuth();

  const home = isAuthenticated ? getRoleHome(user?.role) : "/login";
  const label = isAuthenticated ? "Go to my dashboard" : "Go to login";

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <h1>Access Denied</h1>
        <p className="unauthorized-message">
          You do not have permission to view this page.
        </p>
        <Link to={home} className="btn btn-primary">
          {label}
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;
