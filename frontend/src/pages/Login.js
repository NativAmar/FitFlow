import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRoleHome(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "trainer") return "/trainer/dashboard";
  if (role === "trainee") return "/trainee/dashboard";
  return "/dashboard";
}

function Login() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated — go straight to role dashboard
  if (!loading && isAuthenticated) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <p className="loading">Loading…</p>
      </div>
    );
  }

  function validate() {
    const errors = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      navigate(getRoleHome(loggedInUser.role), { replace: true });
    } catch (err) {
      setSubmitError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFieldErrors({});
    setSubmitError("");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>FitFlow Login</h1>
        <p className="demo-hint">
          Demo:{" "}
          <button
            type="button"
            className="btn-link"
            onClick={() => fillDemo("admin@fitflow.com", "123456")}
          >
            Admin
          </button>
          {" · "}
          <button
            type="button"
            className="btn-link"
            onClick={() => fillDemo("trainer@fitflow.com", "123456")}
          >
            Trainer
          </button>
          {" · "}
          <button
            type="button"
            className="btn-link"
            onClick={() => fillDemo("trainee@fitflow.com", "123456")}
          >
            Trainee
          </button>
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.email && (
              <p className="error">{fieldErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.password && (
              <p className="error">{fieldErrors.password}</p>
            )}
          </div>

          {submitError && <p className="error">{submitError}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
