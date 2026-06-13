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
    setUserEmail(user.email || "your@email.com");
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
    <div className={`vf-screen ${mounted ? "vf-screen--visible" : ""}`}>
      {/* Desktop-only decorative shapes */}
      <div className="vf-deco vf-deco--1" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--2" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--3" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--4" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--5" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--6" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--7" aria-hidden="true"></div>
      <div className="vf-deco vf-deco--8" aria-hidden="true"></div>

      {/* Desktop-only top bar with brand + theme toggle */}
      <div className="vf-desktop-topbar">
        <div className="vf-brand">Weeslie</div>
        <div className="vf-desktop-theme"><ThemeToggle /></div>
      </div>

      <div className={`vf-card ${mounted ? "vf-card--visible" : ""}`}>
        <div className="vf-header">
          <button className="vf-back-btn" onClick={onBack} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="vf-step-label">Step 3 of 3</div>
          <ThemeToggle />
        </div>

        <div className="vf-section-tag">
          <span>Account Setup</span>
          <span className="vf-step-tag">STEP 3 OF 3</span>
        </div>

        <div className="vf-progress-track">
          <div className="vf-progress-bar" style={{ width: "100%" }}></div>
        </div>

        <div className="vf-icon-circle">
          <img src={myemail} alt="email" className="vf-icon-img" />
        </div>

        <h2 className="vf-title">Verify your email</h2>
        <p className="vf-subtitle">
          We've sent a 6-digit code to <strong>{userEmail}</strong>. Enter it below to continue.
        </p>

        <div className="vf-code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={6}
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
            <span>⏱</span>
            <span>00:{String(timeLeft).padStart(2, "0")}</span>
          </div>
        </div>

        <div className="vf-spacer"></div>

        <button
          onClick={handleSubmit}
          disabled={!allFilled || loading}
          className={`vf-verify-btn ${allFilled ? "vf-verify-btn--ready" : ""} ${loading ? "vf-verify-btn--loading" : ""}`}
        >
          {loading ? <div className="vf-spinner"></div> : "Verify"}
        </button>

        <div className="vf-resend">
          Didn't receive the code?{" "}
          <span
            onClick={handleResend}
            className={`vf-resend-link ${timeLeft > 0 || resending ? "vf-resend-link--disabled" : "vf-resend-link--active"}`}
          >
            {resending ? "Sending..." : `Resend ${timeLeft > 0 ? `(${timeLeft}s)` : ""}`}
          </span>
        </div>
      </div>
    </div>
  );
}
