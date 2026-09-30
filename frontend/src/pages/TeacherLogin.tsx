import { useState } from "react";
import type { FormEvent } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getSessionToken, loginTeacher } from "../services/auth";
import "./TeacherLogin.css";

function TeacherLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (getSessionToken()) {
    return <Navigate to="/teacher" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("Enter both username and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await loginTeacher(cleanUsername, password);

      const from =
        (location.state as { from?: string } | null)?.from ||
        "/teacher";

      navigate(from, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to log in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <section className="admin-login-brand">
          <div className="admin-login-mark">SCI</div>

          <span className="admin-login-eyebrow">
            ADMIN PORTAL
          </span>

          <h1>SciGenesis Coaching Institute</h1>

          <p>
            Secure access to the teacher dashboard and website
            management tools.
          </p>

          <div className="admin-login-points">
            <span>✓ Content management</span>
            <span>✓ Student enquiries</span>
            <span>✓ Study materials & gallery</span>
          </div>
        </section>

        <section className="admin-login-card">
          <div className="admin-login-heading">
            <span>Teacher Access</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <label htmlFor="admin-username">
              Username
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                disabled={isSubmitting}
                autoFocus
              />
            </label>

            <label htmlFor="admin-password">
              Password
              <div className="admin-password-field">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={isSubmitting}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div className="admin-login-error" role="alert">
                <strong>Login failed</strong>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="admin-login-footer">
            <span>Authorized teachers only</span>
            <a href="/">← Back to website</a>
          </div>
        </section>
      </div>
    </main>
  );
}

export default TeacherLogin;