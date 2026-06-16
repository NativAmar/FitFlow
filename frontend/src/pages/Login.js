import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("trainer@fitflow.com");
    setPassword("123456");
    setFieldErrors({});
    setSubmitError("");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>FitFlow Login</h1>
        <p className="demo-hint">
          Demo: trainer@fitflow.com / 123456{" "}
          <button type="button" className="btn-link" onClick={fillDemo}>
            Fill demo
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
              disabled={loading}
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
              disabled={loading}
            />
            {fieldErrors.password && (
              <p className="error">{fieldErrors.password}</p>
            )}
          </div>

          {submitError && <p className="error">{submitError}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
