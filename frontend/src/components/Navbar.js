import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../services/authService";
import { getMe } from "../services/usersService";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setUser(getStoredUser());
        }
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "User";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">FitFlow</Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <div className="navbar-user">
        <span className="navbar-username">{displayName}</span>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
