

import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LogIn, Truck, Sun, Moon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import "./Login.css";
import { login } from "./services/authService";
import API_URL from "./services/http";
import { toastError, toastInfo, toastSuccess } from "./services/toastService";

export default function Login({ onBack, onSuccess, onCreateAccount, onForgotPassword }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.body.classList.contains("dark-mode")
  );

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userEncoded = params.get("user");
    if (!token) return;
    try {
      localStorage.setItem("token", token);
      if (userEncoded) {
        const user = JSON.parse(decodeURIComponent(userEncoded));
        localStorage.setItem("user", JSON.stringify(user));
      }
      window.history.replaceState({}, "", "/login");
      if (onSuccess) onSuccess();
    } catch {
      toastError("Google login callback was invalid.");
    }
  }, [onSuccess]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const showError = (msg) => toastError(msg);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { showError("Please fill in all fields."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { showError("Please enter a valid email address."); return; }
   
    try {
      setLoading(true);
      const data = await login(form.email, form.password);
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toastSuccess("Logged in successfully", { description: "Welcome back to Wesselli." });
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error(err);
      showError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSocialLoading("google");
      const response = await fetch(`${API_URL}/auth/google`);
      const data = await response.json();
      if (!response.ok || !data?.authUrl) {
        throw new Error(data?.message || "Failed to start Google login.");
      }
      window.location.href = data.authUrl;
    } catch (err) {
      console.error(err);
      showError(err.message || "Google login failed. Please try again.");
      setSocialLoading("");
    }
  };

  const handleAppleLogin = async () => {
    try {
      setSocialLoading("apple");
      toastInfo("Apple login is coming soon", {
        description: "Please use email/password or Google for now.",
      });
      showError("Apple login is not available yet.");
    } finally {
      setSocialLoading("");
    }
  };

  const toggleTheme = () => {
    const next = !document.body.classList.contains("dark-mode");
    document.body.classList.toggle("dark-mode", next);
    setIsDark(next);
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-4.9c-2 1.4-4.4 2.4-7 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.3 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 4.9c-.4.4 6.7-4.9 6.7-14.4 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );

  const AppleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.22-1.18 3.02-.81.86-2.13 1.52-3.22 1.43-.13-1.11.42-2.27 1.16-3.02.83-.86 2.24-1.49 3.24-1.43zm3.95 17.57c-.66 1.43-.97 2.07-1.81 3.34-1.18 1.78-2.85 3.99-4.92 4.01-1.84.02-2.32-1.2-4.83-1.18-2.51.02-3.04 1.21-4.88 1.19-2.07-.02-3.65-2.02-4.83-3.8C-2.51 16.94-2.93 11.55.6 8.7c1.62-1.31 3.78-1.97 5.81-1.97 2.09 0 3.41 1.15 5.13 1.15 1.67 0 2.69-1.15 5.13-1.15 1.83 0 3.78.99 5.16 2.71-4.53 2.49-3.79 8.97 2.49 9.56z"/>
    </svg>
  );

  /* ── Mobile-only form (kept exactly as before, structurally) ── */
  const formContent = (
    <>
      <div className="login-welcome-wrap">
        <h2 className="login-welcome">Welcome Back</h2>
        <p className="login-sub">Continue your journey with Wesselli.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="login-field">
          <label className="login-label">Email Address</label>
          <div className="login-input-wrapper">
            <Mail size={16} className="login-input-icon" />
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="login-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="login-label">Password</label>
            <button type="button" className="login-forgot" onClick={onForgotPassword}>
              Forgot Password?
            </button>
          </div>
          <div className="login-input-wrapper">
            <Lock size={16} className="login-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange("password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
          {!loading && <LogIn size={18} />}
        </button>

        <div className="login-divider"><span>OR CONTINUE WITH</span></div>

        <div className="login-social-row">
          <button type="button" className="login-social-btn" onClick={handleGoogleLogin} disabled={!!socialLoading}>
            {socialLoading === "google" ? "Loading..." : (<><GoogleIcon /> Google</>)}
          </button>
          <button type="button" className="login-social-btn" onClick={handleAppleLogin} disabled={!!socialLoading}>
            {socialLoading === "apple" ? "Loading..." : (<><AppleIcon /> Apple</>)}
          </button>
        </div>

        <p className="login-register">
          New to Wesselli?{" "}
          <button type="button" className="login-register-link" onClick={onCreateAccount}>
            Create an Account
          </button>
        </p>
      </form>
    </>
  );

  return (
    <>
      {/* ── MOBILE layout (< 992px) — UNCHANGED ── */}
      <div className="login-page">
        <div className={`login-card ${mounted ? "login-card--visible" : ""}`}>
          <div className="login-header">
            <button className="login-back" onClick={onBack} aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
            <span className="login-page-title">Login</span>
            <span className="login-theme-mobile"><ThemeToggle /></span>
          </div>

          <div className="login-logo-wrap">
            <div className="login-logo-circle">
              <Truck size={32} color="var(--app-green)" />
            </div>
            <span className="login-brand">Wesselli</span>
          </div>

          {formContent}
        </div>
      </div>

      {/* ── DESKTOP layout (≥ 992px) — Wesselli split UI ── */}
      <div className="login-desktop">
        {/* Top nav */}
        <nav className="wes-nav">
          <div className="wes-nav-brand">Wesselli</div>

          <div className="wes-nav-links">
            <button type="button" className="wes-nav-link wes-nav-link--active">Main Page</button>
            <button type="button" className="wes-nav-link">Terms of Service</button>
            <button type="button" className="wes-nav-link">Security</button>
            <button type="button" className="wes-nav-link">Contact</button>
          </div>

          <div className="wes-nav-right">
            <button
              type="button"
              className="wes-nav-theme"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="wes-nav-login">Login</button>
            <button type="button" className="wes-nav-cta" onClick={onCreateAccount}>
              Get Started
            </button>
          </div>
        </nav>

        {/* Body split */}
        <div className="wes-body">
          {/* Left: form */}
          <section className="wes-left">
            <form className="wes-form" onSubmit={handleSubmit}>
              <h1 className="wes-form-title">Welcome Back !</h1>

              <div className="wes-field">
                <label className="wes-label">Email Address</label>
                <div className="wes-input-wrap">
                  <Mail size={16} className="wes-input-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange("email")}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="wes-field">
                <label className="wes-label">Password</label>
                <div className="wes-input-wrap">
                  <Lock size={16} className="wes-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange("password")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="wes-eye"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="wes-forgot-row">
                <button type="button" className="wes-forgot" onClick={onForgotPassword}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="wes-submit" disabled={loading}>
                {loading ? "Signing in..." : (<>Login <LogIn size={16} /></>)}
              </button>

              <div className="wes-divider"><span>Or continue with</span></div>

              <div className="wes-socials">
                <button type="button" className="wes-social-btn" onClick={handleGoogleLogin} disabled={!!socialLoading}>
                  {socialLoading === "google" ? "Loading..." : (<><GoogleIcon /> Google</>)}
                </button>
                <button type="button" className="wes-social-btn" onClick={handleAppleLogin} disabled={!!socialLoading}>
                  {socialLoading === "apple" ? "Loading..." : (<><AppleIcon /> Apple</>)}
                </button>
              </div>
            </form>
          </section>

          {/* Right: hero */}
          <aside className="wes-right">
            <div className="wes-right-inner">
              <Truck className="wes-right-icon" size={44} strokeWidth={1.8} />
              <h2 className="wes-right-title">Wesselli</h2>
              <p className="wes-right-desc">
                The trusted bridge between professional truck drivers and businesses,
                ensuring smooth and reliable freight delivery nationwide. With precision
                tracking and verified reliability, every shipment is handled efficiently
                and delivered with confidence.
              </p>

              {/* Truck illustration */}
              <img
                src="/truck.png"
                alt="Wesselli delivery truck"
                className="wes-right-truck"
              />

              <p className="wes-right-cta">
                New to Wesselli?
                <button type="button" className="wes-right-cta-link" onClick={onCreateAccount}>
                  Create an Account
                </button>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
