import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import "./Verification.css";
import myemail from "./photo/mail.svg";
import { verifyCode, resendVerificationCode } from "./services/verificationService";
import { toastError, toastSuccess } from "./services/toastService";

export default function Verification({ onBack, onSuccess }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const inputsRef = useRef([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserEmail(user.email || "");
  }, []);

  useEffect(() => {
    if (timeLeft === 0) return;
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const showError = (msg) => { toastError(msg); };

  const handleSubmit = async () => {
    const codeStr = code.join("");
    if (!/^\d{6}$/.test(codeStr)) {
      showError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyCode(codeStr);
      setLoading(false);
      if (data?.success === true) {
        toastSuccess("Email verified", { description: "Your account is now verified." });
        if (onSuccess) onSuccess();
      } else {
        showError(data?.msg || data?.message || "Invalid code. Please try again.");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      }
    } catch (err) {
      setLoading(false);
      showError("Could not reach the server. Check your connection.");
    }
  };

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length === 6) {
      setCode(value.split(""));
      inputsRef.current[5]?.focus();
      return;
    }
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e, index) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const nextCode = [...code];
    const availableSlots = 6 - index;
    const chars = pasted.slice(0, availableSlots).split("");
    chars.forEach((char, offset) => { nextCode[index + offset] = char; });
    setCode(nextCode);
    const nextFocusIndex = Math.min(index + chars.length, 5);
    inputsRef.current[nextFocusIndex]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  };

  const handleSendEmail = async () => {
    if (!userEmail) {
      showError("Please enter your email address.");
      return;
    }
    setResending(true);
    try {
      const data = await resendVerificationCode(userEmail);
      if (data?.success) {
        setTimeLeft(60);
        setCode(["", "", "", "", "", ""]);
        toastSuccess("Code sent", { description: "A verification code has been sent to your email." });
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      } else {
        showError(data?.message || "Failed to send code");
      }
    } catch (err) {
      showError("Could not send code. Try again later.");
    } finally {
      setResending(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setResending(true);
    try {
      const data = await resendVerificationCode(userEmail);
      if (data?.success) {
        setTimeLeft(60);
        setCode(["", "", "", "", "", ""]);
        toastSuccess("Code resent", { description: "A new verification code has been sent." });
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      } else {
        showError(data?.message || "Failed to resend code");
      }
    } catch (err) {
      showError("Could not resend code. Try again later.");
    } finally {
      setResending(false);
    }
  };

  const allFilled = code.every(d => d !== "");

  return (
    <div className="vf-screen">
      {/* ===== DESKTOP-ONLY top bar ===== */}
      <div className="vf-desktop-topbar">
        <div className="vf-brand">Wesselli</div>

        <div className="vf-topbar-links">
          <button type="button" className="vf-topbar-link vf-topbar-link--active">Main Page</button>
          <button type="button" className="vf-topbar-link">Terms of Service</button>
          <button type="button" className="vf-topbar-link">Security</button>
          <button type="button" className="vf-topbar-link">Contact</button>
        </div>

        <div className="vf-topbar-right">
          <div className="vf-desktop-theme">
            <ThemeToggle />
          </div>
          <button type="button" className="vf-topbar-login">Login</button>
          <button type="button" className="vf-topbar-cta">Get Started</button>
        </div>
      </div>

      <div className={`vf-card ${mounted ? "vf-card--visible" : ""}`}>
        {/* Mobile-only header */}
        <div className="vf-header">
          <button className="vf-back-btn" onClick={onBack} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="vf-step-label">Step 3 of 3</span>
          <ThemeToggle />
        </div>

        <div className="vf-section-tag">
          <span>Account Setup</span>
          <span className="vf-step-tag">STEP 3 OF 3</span>
        </div>

        <div className="vf-progress-track">
          <div className="vf-progress-bar" style={{ width: "100%" }} />
        </div>

        {/* Icon circle */}
        <div className="vf-icon-circle">
          <img src={myemail} alt="" className="vf-icon-img" />
        </div>

        <h1 className="vf-title">Verify your email</h1>

        <p className="vf-subtitle vf-subtitle--mobile">
          We've sent a 6-digit code to {userEmail || "your email"}. Enter it below to continue.
        </p>
        <p className="vf-subtitle vf-subtitle--desktop">Enter your details.</p>

        {/* Desktop-only email field */}
        <div className="vf-field">
          <label className="vf-field-label" htmlFor="vf-email">Email Address</label>
          <div className="vf-field-input-wrap">
            <span className="vf-field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <input
              id="vf-email"
              type="email"
              className="vf-field-input"
              placeholder="omar@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop-only send button */}
        <button
          type="button"
          className="vf-send-btn"
          onClick={handleSendEmail}
          disabled={resending}
        >
          {resending ? "Sending..." : "Send"}
        </button>

        <div className="vf-code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={index === 0 ? 6 : 1}
              value={digit}
              ref={el => (inputsRef.current[index] = el)}
              onChange={e => handleChange(e.target.value, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              onPaste={e => handlePaste(e, index)}
              className={`vf-code-input ${digit ? "vf-code-input--filled" : ""}`}
            />
          ))}
        </div>

        <div className="vf-timer-row">
          <div className="vf-timer-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="vf-timer-mobile">00:{String(timeLeft).padStart(2, "0")}</span>
            <span className="vf-timer-desktop">00:{String(timeLeft).padStart(2, "0")}</span>
          </div>
        </div>

        <p className="vf-resend-helper">Wait before resending code</p>

        <div className="vf-spacer" />

        <button
          className={`vf-verify-btn ${allFilled ? "vf-verify-btn--ready" : ""} ${loading ? "vf-verify-btn--loading" : ""}`}
          onClick={handleSubmit}
          disabled={!allFilled || loading}
        >
          {loading ? <div className="vf-spinner" /> : "Verify"}
        </button>

        <p className="vf-resend">
          Didn't receive the code?{" "}
          <span
            onClick={handleResend}
            className={`vf-resend-link ${timeLeft > 0 || resending ? "vf-resend-link--disabled" : "vf-resend-link--active"}`}
          >
            {resending
              ? "Sending..."
              : timeLeft > 0
              ? <>Resend (<span className="vf-resend-timer">{timeLeft}s</span>)</>
              : "Resend"}
          </span>
        </p>
      </div>
    </div>
  );
}
