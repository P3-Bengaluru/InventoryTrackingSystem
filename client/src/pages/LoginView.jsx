import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import './LoginView.css';

export default function LoginView() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);

      // Login success.
      // Redirect is handled by App/AuthContext.
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-orb login-orb-top" />
      <div className="login-orb login-orb-bottom" />
      <div className="login-grid" />

      <main className="login-container">
        <section className="login-card">

          {/* Logo */}
          <div className="login-brand">
            {/* Replace this with your actual P3ITS logo */}
            <div className="login-logo">
              P3
            </div>

            <div className="login-brand-text">
              <span className="login-brand-name">
                P3<span> ITS</span>
              </span>

              <span className="login-brand-subtitle">
                INVENTORY OS
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="login-header">
            <h1>Welcome back</h1>

            <p>
              Sign in to your P3-ITS account to continue.
            </p>
          </div>

          {/* Login form */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {/* Email */}
            <div className="login-field">
              <label htmlFor="email">
                Email address
              </label>

              <div className="login-input">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />

                  <path d="m3 7 9 6 9-6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => {
                    // Add password reset flow here later.
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="login-input">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="11"
                    rx="2"
                  />

                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.5 4 11 8-0.6 1.5-1.4 2.7-2.5 3.8" />
                      <path d="M6.2 6.2C4.6 7.3 3.3 9.1 1 12c1.5 4 5.5 8 11 8 1.7 0 3.2-.4 4.5-1" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span className="custom-checkbox">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="m5 12 4 4L19 7" />
                </svg>
              </span>

              <span>Remember me</span>
            </label>

            {/* Error */}
            {error && (
              <div className="login-error">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
           <Button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>

                  <svg
                    className="login-submit-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <span>P3-ITS</span>
            <span>•</span>
            <span>Inventory Management</span>
          </div>

        </section>
      </main>
    </div>
  );
}