import React, { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import "./Createaccount.css";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const PersonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const BusinessIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 21h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M5 10V21M9 10V21M15 10V21M19 10V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 3L3 10h18L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SmallTruckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M6 18h28v22H6z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M34 26h12l8 8v6H34z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    <circle cx="18" cy="44" r="4.5" stroke="currentColor" strokeWidth="3"/>
    <circle cx="44" cy="44" r="4.5" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

export default function CreateAccountScreen({ onBack, onNext, onLogin, onGetStarted, typeOnly = false }) {
  const [form, setForm] = useState({
    phone: "", email: "", password: "", confirmPassword: "", role: "Individual"
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const validate = () => {
    if (typeOnly) return {};
    const e = {};
    if (!form.phone || form.phone.replace(/\D/g, "").length !== 10)
      e.phone = "Phone number must be exactly 10 digits.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address.";
    if (!form.password || form.password.length < 10)
      e.password = "Password must be at least 10 characters.";
    if (form.confirmPassword !== form.password)
      e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleNext = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      if (!typeOnly) {
        const mappedType = form.role === "Business" ? "BUSINESS" : "INDIVIDUAL";
        const cleanPhone = form.phone.replace(/\D/g, "");
        const pendingRegistration = {
          email: form.email.trim(),
          password: form.password,
          phone: cleanPhone,
          type: mappedType,
        };
        sessionStorage.setItem("pendingRegistration", JSON.stringify(pendingRegistration));
      }
      if (onNext) onNext(form.role);
    } catch {
      setSubmitError("Failed to keep registration data. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
    setSubmitError("");
  };

  // Reusable form body (used by both mobile card and desktop right panel)
  const FormBody = (
    <>
      {!typeOnly && (
        <div className="ca-fields-grid">
          <div className="ca-field-group">
            <label className="ca-label">Phone Number</label>
            <div className="ca-input-wrap">
              <input
                className={`ca-input ${errors.phone ? "ca-input--error" : ""}`}
                type="tel"
                placeholder="e.g. 0561 89 24 36"
                value={form.phone}
                onChange={e => handleChange("phone", e.target.value)}
                maxLength={14}
              />
            </div>
            {errors.phone && <span className="ca-error ca-error--show">{errors.phone}</span>}
          </div>

          <div className="ca-field-group">
            <label className="ca-label">Email Address</label>
            <div className="ca-input-wrap">
              <input
                className={`ca-input ${errors.email ? "ca-input--error" : ""}`}
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
              />
            </div>
            {errors.email && <span className="ca-error ca-error--show">{errors.email}</span>}
          </div>

          <div className="ca-field-group">
            <label className="ca-label">Password</label>
            <div className="ca-input-wrap">
              <input
                className={`ca-input ca-input--icon ${errors.password ? "ca-input--error" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => handleChange("password", e.target.value)}
              />
              <button
                className="ca-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.password && <span className="ca-error ca-error--show">{errors.password}</span>}
          </div>

          <div className="ca-field-group">
            <label className="ca-label">Confirm Password</label>
            <div className="ca-input-wrap">
              <input
                className={`ca-input ca-input--icon ${errors.confirmPassword ? "ca-input--error" : ""}`}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={e => handleChange("confirmPassword", e.target.value)}
              />
              <button
                className="ca-eye-btn"
                onClick={() => setShowConfirm(v => !v)}
                type="button"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOnIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.confirmPassword && <span className="ca-error ca-error--show">{errors.confirmPassword}</span>}
          </div>
        </div>
      )}

      <div className="ca-field-group ca-role-field-group">
        <label className="ca-label">Select Role</label>
        <div className="ca-role-group ca-role-group--tabs">
          <button
            className={`ca-role-btn ${form.role === "Individual" ? "ca-role-btn--active" : ""}`}
            onClick={() => handleChange("role", "Individual")}
            type="button"
          >
            <span className="ca-role-icon"><PersonIcon /></span>
            <span>Individual</span>
          </button>
          <button
            className={`ca-role-btn ${form.role === "Business" ? "ca-role-btn--active" : ""}`}
            onClick={() => handleChange("role", "Business")}
            type="button"
          >
            <span className="ca-role-icon"><BusinessIcon /></span>
            <span>Business</span>
          </button>
        </div>
      </div>

      {submitError && <span className="ca-error ca-error--show">{submitError}</span>}

      <button
        className="ca-next-btn"
        onClick={handleNext}
        disabled={submitting}
        type="button"
      >
        {submitting ? "Creating..." : "Next"}
      </button>

      {!typeOnly && (
        <p className="ca-login-text">
          Already have an account?{" "}
          <button className="ca-login-link" onClick={onLogin} type="button">Log in</button>
        </p>
      )}
    </>
  );

  return (
    <div className="ca-screen">
      {/* ============ MOBILE-ONLY card (UNCHANGED) ============ */}
      <div className="ca-mobile-only">
        <div className={`ca-card ${mounted ? "ca-card--visible" : ""}`}>
          <div className="ca-topbar">
            <div className="ca-brand-lockup">
              <span className="ca-brand-name">Wesselli</span>
            </div>
          </div>

          <div className="ca-header">
            <button className="ca-back-btn" onClick={onBack} type="button" aria-label="Back">
              <BackIcon />
            </button>
            <span className="ca-step-label">{typeOnly ? "Google setup" : "Step 1 of 3"}</span>
            <span className="ca-theme-mobile"><ThemeToggle /></span>
          </div>

          <div className="ca-section-tag">
            <span>Account Setup</span>
            <span className="ca-step-tag">{typeOnly ? "GOOGLE" : "STEP 1 OF 3"}</span>
          </div>

          <div className="ca-progress-track">
            <div className="ca-progress-bar" style={{ width: typeOnly ? "100%" : "33%" }} />
          </div>

          <div className="ca-hero-copy">
            <h1 className="ca-title">{typeOnly ? "Choose Account Type" : "Create Account"}</h1>
            <p className="ca-subtitle">
              {typeOnly
                ? "Select Individual or Business to complete your Google account setup."
                : "Join Wesselli today. Enter your details to get started with fast deliveries."}
            </p>
          </div>

          {FormBody}
        </div>
      </div>

      {/* ============ DESKTOP-ONLY split layout ============ */}
      <div className="ca-desktop-only">
        {/* Top nav bar */}
        <nav className="ca-topnav">
          <div className="ca-topnav-brand">Wesselli</div>

          <div className="ca-topnav-links">
            <button type="button" className="ca-topnav-link ca-topnav-link--active">Main Page</button>
            <button type="button" className="ca-topnav-link">Terms of Service</button>
            <button type="button" className="ca-topnav-link">Security</button>
            <button type="button" className="ca-topnav-link">Contact</button>
          </div>

          <div className="ca-topnav-right">
            <span className="ca-topnav-theme"><ThemeToggle /></span>
            <button type="button" className="ca-topnav-login" onClick={onLogin}>Login</button>
            <button type="button" className="ca-topnav-cta" onClick={onGetStarted || onLogin}>Get Started</button>
          </div>
        </nav>

        <div className="ca-desktop-body">
          {/* LEFT: green hero panel with truck */}
          <aside className="ca-left-panel">
            <div className="ca-hero">
              <div className="ca-hero-top">
                <SmallTruckIcon />
                <h2 className="ca-hero-brand">Wesselli</h2>
                <p className="ca-hero-desc">
                  The trusted bridge between professional truck drivers and businesses,
                  ensuring smooth and reliable freight delivery nationwide. With
                  precision tracking and verified reliability, every shipment is handled
                  efficiently and delivered with confidence.
                </p>
              </div>

              <img
                src="/truck.png"
                alt="Wesselli delivery truck"
                className="ca-hero-truck-img"
              />

              <div className="ca-hero-bottom">
                <span>New to Wesselli?</span>
                <button className="ca-hero-login" onClick={onGetStarted || onLogin} type="button">
                  Create an Account
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT: form panel */}
          <section className="ca-right-panel">
            <div className="ca-card ca-card--desktop">
              <h1 className="ca-title">Create Account</h1>
              <p className="ca-subtitle">
                Join Wesselli today. Enter your details to get started with fast deliveries.
              </p>
              {FormBody}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
