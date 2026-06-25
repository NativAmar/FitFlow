import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_STATUS = ["active", "paused", "completed"];

function TraineeForm({
  mode,
  initialData,
  activeTrainers,
  onSubmit,
  onCancel,
  submitting,
  submitError,
  roleMode = "admin", // "admin" shows trainer selection; "trainer" omits it
}) {
  const u = initialData?.user || {};
  const isCreate = mode === "create";

  const [firstName, setFirstName] = useState(u.firstName || "");
  const [lastName, setLastName] = useState(u.lastName || "");
  const [email, setEmail] = useState(u.email || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(u.displayName || "");
  const [trainerId, setTrainerId] = useState(
    isCreate ? "" : String(initialData?.trainer?.id ?? "")
  );
  const [experienceLevel, setExperienceLevel] = useState(
    initialData?.experienceLevel || "beginner"
  );
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(
    String(initialData?.weeklyWorkouts ?? 3)
  );
  const [status, setStatus] = useState(initialData?.status || "active");
  const [notes, setNotes] = useState(initialData?.notes || "");
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
      if (roleMode === "admin" && !trainerId) {
        errors.trainerId = "Please select a trainer.";
      }
    }

    if (!VALID_LEVELS.includes(experienceLevel)) {
      errors.experienceLevel = "Please select a valid experience level.";
    }

    const ww = parseInt(weeklyWorkouts, 10);
    if (!weeklyWorkouts || isNaN(ww) || ww < 1 || ww > 255) {
      errors.weeklyWorkouts = "Weekly workouts must be an integer between 1 and 255.";
    }

    if (!VALID_STATUS.includes(status)) {
      errors.status = "Please select a valid training status.";
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
      experienceLevel,
      weeklyWorkouts: parseInt(weeklyWorkouts, 10),
      status,
      notes: notes.trim() || null,
    };

    if (isCreate) {
      payload.password = password;
      if (roleMode === "admin") {
        payload.trainerId = parseInt(trainerId, 10);
      }
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="form" noValidate>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="atf-firstName">
            First Name{" "}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="atf-firstName"
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
          <label htmlFor="atf-lastName">
            Last Name{" "}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="atf-lastName"
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
        <label htmlFor="atf-email">
          Email{" "}
          <span className="required-mark" aria-hidden="true">*</span>
        </label>
        <input
          id="atf-email"
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
          <label htmlFor="atf-password">
            Password{" "}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="atf-password"
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
        <label htmlFor="atf-displayName">Display Name</label>
        <input
          id="atf-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={submitting}
          placeholder="Optional — defaults to first + last name"
        />
      </div>

      {isCreate && roleMode === "admin" && (
        <div className="form-group">
          <label htmlFor="atf-trainerId">
            Trainer{" "}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <select
            id="atf-trainerId"
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
            disabled={submitting}
          >
            <option value="">— Select a trainer —</option>
            {activeTrainers.map((trainer) => {
              const tu = trainer.user || {};
              const label = tu.firstName
                ? `${tu.firstName} ${tu.lastName}`
                : `Trainer #${trainer.id}`;
              const spec = trainer.specialization
                ? ` (${trainer.specialization})`
                : "";
              return (
                <option key={trainer.id} value={String(trainer.id)}>
                  {label}{spec}
                </option>
              );
            })}
          </select>
          {fieldErrors.trainerId && (
            <p className="error" role="alert">
              {fieldErrors.trainerId}
            </p>
          )}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="atf-experienceLevel">
            Experience Level{" "}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <select
            id="atf-experienceLevel"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            disabled={submitting}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          {fieldErrors.experienceLevel && (
            <p className="error" role="alert">
              {fieldErrors.experienceLevel}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="atf-weeklyWorkouts">
            Weekly Workouts{" "}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="atf-weeklyWorkouts"
            type="number"
            min="1"
            max="255"
            value={weeklyWorkouts}
            onChange={(e) => setWeeklyWorkouts(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.weeklyWorkouts && (
            <p className="error" role="alert">
              {fieldErrors.weeklyWorkouts}
            </p>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="atf-status">Training Status</label>
        <select
          id="atf-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={submitting}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        {fieldErrors.status && (
          <p className="error" role="alert">
            {fieldErrors.status}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="atf-notes">Trainer Notes</label>
        <textarea
          id="atf-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          rows={3}
          placeholder="Optional trainer observations"
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
            ? "Create Trainee"
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

export default TraineeForm;
