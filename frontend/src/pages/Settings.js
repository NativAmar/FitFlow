import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../services/settingsService";
import { applyTheme } from "../services/themeService";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_THEMES = ["light", "dark", "system"];

function Settings() {
  const { refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState("light");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");
      try {
        const data = await getSettings();
        if (!cancelled) {
          setDisplayName(data.displayName || "");
          setEmail(data.email || "");
          setTheme(data.theme || "light");
          applyTheme(data.theme || "light");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  function validate() {
    const errors = {};

    if (displayName.trim().length > 200) {
      errors.displayName = "Display name must be at most 200 characters.";
    }

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!VALID_THEMES.includes(theme)) {
      errors.theme = "Theme must be light, dark, or system.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSettings({
        displayName: displayName.trim(),
        email: email.trim(),
        theme,
      });
      setDisplayName(updated.displayName);
      setEmail(updated.email);
      setTheme(updated.theme);
      applyTheme(updated.theme);
      setSuccess("Settings saved successfully.");

      // Refresh AuthContext so the Navbar immediately reflects any displayName change
      try {
        await refreshUser();
      } catch {
        // Session expiry is handled by AuthContext; ignore here to preserve success message
      }
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Settings</h1>
        <p className="loading">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Settings</h1>

      <form onSubmit={handleSubmit} className="form settings-form">
        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={saving}
            placeholder="Optional — leave blank to use your full name"
          />
          {fieldErrors.displayName && (
            <p className="error">{fieldErrors.displayName}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="settings-email">Email</label>
          <input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
          />
          {fieldErrors.email && <p className="error">{fieldErrors.email}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            disabled={saving}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          {fieldErrors.theme && <p className="error">{fieldErrors.theme}</p>}
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

export default Settings;
