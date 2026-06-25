import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TrainerForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  const u = initialData?.user || {};
  const isCreate = mode === "create";

  const [firstName, setFirstName] = useState(u.firstName || "");
  const [lastName, setLastName] = useState(u.lastName || "");
  const [email, setEmail] = useState(u.email || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(u.displayName || "");
  const [specialization, setSpecialization] = useState(
    initialData?.specialization || ""
  );
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};

    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (isCreate) {
      if (!password) {
        errors.password = "Password is required.";
      } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      displayName: displayName.trim() || null,
      specialization: specialization.trim() || null,
    };

    if (isCreate) {
      payload.password = password;
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="form" noValidate>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tf-firstName">
            First Name{" "}
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="tf-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={submitting}
            autoComplete="given-name"
          />
          {fieldErrors.firstName && (
            <p className="error" role="alert">
              {fieldErrors.firstName}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tf-lastName">
            Last Name{" "}
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="tf-lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={submitting}
            autoComplete="family-name"
          />
          {fieldErrors.lastName && (
            <p className="error" role="alert">
              {fieldErrors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tf-email">
          Email{" "}
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="tf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
        />
        {fieldErrors.email && (
          <p className="error" role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {isCreate && (
        <div className="form-group">
          <label htmlFor="tf-password">
            Password{" "}
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="tf-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
          />
          {fieldErrors.password && (
            <p className="error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tf-displayName">Display Name</label>
        <input
          id="tf-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={submitting}
          placeholder="Optional — defaults to first + last name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="tf-specialization">Specialization</label>
        <input
          id="tf-specialization"
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          disabled={submitting}
          placeholder="e.g. Strength and Conditioning"
        />
      </div>

      {submitError && (
        <p className="error" role="alert">
          {submitError}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting
            ? isCreate
              ? "Creating…"
              : "Saving…"
            : isCreate
            ? "Create Trainer"
            : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default TrainerForm;
