import React, { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import "./Businessregscreen.css";
import { BusinessProfile } from "./services/profileService";
import { uploadPhoto } from "./services/uploadService";
import { register } from "./services/authService";
import { ALGERIAN_CITIES } from "./constants/algerianCities";

function CityAutocompleteField({ value, onChange, placeholder, inputClassName = "" }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = (query) =>
    ALGERIAN_CITIES
      .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);

  const handleInputChange = (nextValue) => {
    onChange(nextValue);
    setSelectedIndex(-1);

    if (!nextValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestions(filteredCities(nextValue));
    setShowSuggestions(true);
  };

  const selectCity = (city) => {
    onChange(city);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      selectCity(suggestions[selectedIndex]);
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="br-city-autocomplete" ref={wrapperRef}>
      <input
        className={inputClassName}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => {
          if (value.trim()) {
            setSuggestions(filteredCities(value));
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 ? (
        <ul className="br-city-suggestions">
          {suggestions.map((city, index) => (
            <li
              key={city}
              className={`br-city-suggestion-item ${index === selectedIndex ? "selected" : ""}`}
              onMouseDown={() => selectCity(city)}
            >
              {city}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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

export default function BusinessRegScreen({ onBack, onNext, onLogin, onGetStarted }) {
  const [form, setForm] = useState({
    businessName: "",
    rcNumber: "",
    tin: "",
    sin: "",
    legalForm: "",
    locations: [""],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required.";
    if (!/^\d{2}-[AB]-\d{7}$/i.test(form.rcNumber.trim()))
      e.rcNumber = "RC number format must be 00-A-0000000 or 00-B-0000000.";
    if (!/^\d{15}$/.test(form.tin)) e.tin = "NIF must contain exactly 15 digits.";
    if (!/^\d{15}$/.test(form.sin)) e.sin = "NIS must contain exactly 15 digits.";
    if (!form.legalForm.trim()) e.legalForm = "Legal form is required.";

    const cleanedLocations = (form.locations || [])
      .map((value) => value.trim())
      .filter(Boolean);

    if (cleanedLocations.length === 0) {
      e.locations = "At least one business location is required.";
    } else if (
      cleanedLocations.some(
        (location) => !ALGERIAN_CITIES.some((city) => city.toLowerCase() === location.toLowerCase())
      )
    ) {
      e.locations = "Please select valid locations from the list.";
    }

    return e;
  };

  const addLocationField = () => {
    setForm((prev) => ({ ...prev, locations: [...(prev.locations || [""]), ""] }));
    setErrors((prev) => ({ ...prev, locations: undefined }));
  };

  const removeLocationField = (index) => {
    setForm((prev) => {
      const nextLocations = prev.locations || [""];

      if (nextLocations.length === 1) {
        return { ...prev, locations: [""] };
      }

      return {
        ...prev,
        locations: nextLocations.filter((_, i) => i !== index),
      };
    });
    setErrors((prev) => ({ ...prev, locations: undefined }));
  };

  const updateLocationField = (index, value) => {
    setForm((prev) => ({
      ...prev,
      locations: (prev.locations || [""]).map((current, i) => (i === index ? value : current)),
    }));
    setErrors((prev) => ({ ...prev, locations: undefined }));
    setSubmitError("");
  };

  const handleNext = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitError("");
    setSubmitting(true);

    try {
      const existingToken = localStorage.getItem("token");

      if (!existingToken) {
        const pendingRaw = sessionStorage.getItem("pendingRegistration");
        if (!pendingRaw) {
          throw new Error("Missing account setup data. Please complete Step 1 first.");
        }

        const pending = JSON.parse(pendingRaw);
        const data = await register(pending.email, pending.password, pending.phone, pending.type);

        if (data?.token) localStorage.setItem("token", data.token);
        if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

        sessionStorage.removeItem("pendingRegistration");
      }

      const uploadedPhotoPath = photoFile ? await uploadPhoto(photoFile) : undefined;

      const normalizedLocations = (form.locations || [])
        .map((value) => value.trim())
        .filter(Boolean);

      await BusinessProfile({
        business_Name: form.businessName.trim(),
        rc_Number: form.rcNumber.trim().toUpperCase(),
        form: form.legalForm.trim(),
        nif: form.tin,
        nis: form.sin,
        locations: normalizedLocations,
        photo: uploadedPhotoPath,
      });

      if (onNext) onNext(form);
    } catch (err) {
      setSubmitError(err.message || "Failed to save business profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
    setSubmitError("");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) { setPhotoFile(null); return; }
    if (!file.type.startsWith("image/")) {
      setSubmitError("Please choose a valid image file.");
      setPhotoFile(null);
      return;
    }
    setPhotoFile(file);
    setSubmitError("");
  };

  // Reusable form body (used by the desktop card)
  const FormBody = (
    <>
      <div className="br-field-group">
        <label className="br-label">Business Name</label>
        <input className={`br-input ${errors.businessName ? "br-input--error" : ""}`}
          type="text" placeholder="e.g. Benali Logistics SARL"
          value={form.businessName} onChange={e => handleChange("businessName", e.target.value)}/>
        {errors.businessName && <span className="br-error br-error--show">{errors.businessName}</span>}
      </div>

      <div className="br-field-group">
        <label className="br-label">RC Number</label>
        <input className={`br-input ${errors.rcNumber ? "br-input--error" : ""}`}
          type="text" placeholder="e.g. 16-A-1234567"
          value={form.rcNumber}
          onChange={e => handleChange("rcNumber", e.target.value.toUpperCase())}
          maxLength={12}/>
        {errors.rcNumber && <span className="br-error br-error--show">{errors.rcNumber}</span>}
      </div>

      <div className="br-field-group">
        <label className="br-label">NIF</label>
        <input className={`br-input ${errors.tin ? "br-input--error" : ""}`}
          type="text" placeholder="e.g. 123456789012345"
          value={form.tin}
          onChange={e => handleChange("tin", e.target.value.replace(/\D/g, "").slice(0, 15))}
          inputMode="numeric"
          maxLength={15}/>
        {errors.tin && <span className="br-error br-error--show">{errors.tin}</span>}
      </div>

      <div className="br-field-group">
        <label className="br-label">NIS</label>
        <input className={`br-input ${errors.sin ? "br-input--error" : ""}`}
          type="text" placeholder="e.g. 123456789012345"
          value={form.sin}
          onChange={e => handleChange("sin", e.target.value.replace(/\D/g, "").slice(0, 15))}
          inputMode="numeric"
          maxLength={15}/>
        {errors.sin && <span className="br-error br-error--show">{errors.sin}</span>}
      </div>

      <div className="br-field-group">
        <label className="br-label">Legal Form</label>
        <input className={`br-input ${errors.legalForm ? "br-input--error" : ""}`}
          type="text" placeholder="e.g. SARL, SPA, EI"
          value={form.legalForm} onChange={e => handleChange("legalForm", e.target.value)}/>
        {errors.legalForm && <span className="br-error br-error--show">{errors.legalForm}</span>}
      </div>

      <div className="br-field-group br-location-group">
        <label className="br-label">Business Locations</label>
        {form.locations.map((locationValue, index) => (
          <div className="br-location-row" key={`desktop-location-${index}`}>
            <CityAutocompleteField
              inputClassName={`br-input ${errors.locations ? "br-input--error" : ""}`}
              placeholder={index === 0 ? "Main location (e.g. Algiers)" : `Location ${index + 1}`}
              value={locationValue}
              onChange={(nextValue) => updateLocationField(index, nextValue)}
            />
            <button
              className="br-location-remove"
              type="button"
              onClick={() => removeLocationField(index)}
              disabled={form.locations.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button className="br-location-add" type="button" onClick={addLocationField}>
          Add Location
        </button>
        <span className="br-location-hint">The first location will be used as the main location.</span>
        {errors.locations && <span className="br-error br-error--show">{errors.locations}</span>}
      </div>

      <div className="br-field-group br-photo-group">
        <label className="br-label" htmlFor="business-profile-photo">Profile Photo (optional)</label>
        <label className="br-upload-box" htmlFor="business-profile-photo">
          <span className="br-upload-main">Choose profile photo</span>
          <span className="br-upload-sub">PNG, JPG, WEBP</span>
        </label>
        <input
          id="business-profile-photo"
          className="br-file-input"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
        />
        {photoFile ? <span className="br-upload-selected">Selected: {photoFile.name}</span> : null}
      </div>

      <div className="br-spacer" />

      {submitError && <span className="br-error br-error--show">{submitError}</span>}

      <button className="br-next-btn" onClick={handleNext} disabled={submitting} type="button">
        {submitting ? "Saving..." : "Next"}
      </button>

      <p className="br-login-text">
        Already have an account?{" "}
        <button type="button" className="br-login-link" onClick={onLogin}>Log in</button>
      </p>
    </>
  );

  return (
    <div className="br-screen">
      {/* ============ MOBILE-ONLY (UNCHANGED) ============ */}
      <div className={`br-card br-mobile-only ${mounted ? "br-card--visible" : ""}`}>

        <div className="br-header">
          <button className="br-back-btn" onClick={onBack} type="button"><BackIcon /></button>
          <span className="br-step-label">Step 2 of 3</span>
          <ThemeToggle />
        </div>

        <div className="br-section-tag">
          Account Setup <span className="br-step-tag">STEP 2 OF 3</span>
        </div>

        <div className="br-progress-track">
          <div className="br-progress-bar" style={{ width: mounted ? "66%" : "0%" }} />
        </div>

        <h1 className="br-title">Business Account</h1>
        <p className="br-subtitle">Enter your business details to complete your registration.</p>

        <div className="br-field-group">
          <label className="br-label">Business Name</label>
          <input className={`br-input ${errors.businessName ? "br-input--error" : ""}`}
            type="text" placeholder="e.g. Benali Logistics SARL"
            value={form.businessName} onChange={e => handleChange("businessName", e.target.value)}/>
          {errors.businessName && <span className="br-error br-error--show">{errors.businessName}</span>}
        </div>

        <div className="br-field-group">
          <label className="br-label">RC Number</label>
          <input className={`br-input ${errors.rcNumber ? "br-input--error" : ""}`}
            type="text" placeholder="e.g. 16-A-1234567"
            value={form.rcNumber}
            onChange={e => handleChange("rcNumber", e.target.value.toUpperCase())}
            maxLength={12}/>
          {errors.rcNumber && <span className="br-error br-error--show">{errors.rcNumber}</span>}
        </div>

        <div className="br-field-group">
          <label className="br-label">NIF</label>
          <input className={`br-input ${errors.tin ? "br-input--error" : ""}`}
            type="text" placeholder="e.g. 123456789012345"
            value={form.tin}
            onChange={e => handleChange("tin", e.target.value.replace(/\D/g, "").slice(0, 15))}
            inputMode="numeric"
            maxLength={15}/>
          {errors.tin && <span className="br-error br-error--show">{errors.tin}</span>}
        </div>

        <div className="br-field-group">
          <label className="br-label">NIS</label>
          <input className={`br-input ${errors.sin ? "br-input--error" : ""}`}
            type="text" placeholder="e.g. 123456789012345"
            value={form.sin}
            onChange={e => handleChange("sin", e.target.value.replace(/\D/g, "").slice(0, 15))}
            inputMode="numeric"
            maxLength={15}/>
          {errors.sin && <span className="br-error br-error--show">{errors.sin}</span>}
        </div>

        <div className="br-field-group">
          <label className="br-label">Legal Form</label>
          <input className={`br-input ${errors.legalForm ? "br-input--error" : ""}`}
            type="text" placeholder="e.g. SARL, SPA, EI"
            value={form.legalForm} onChange={e => handleChange("legalForm", e.target.value)}/>
          {errors.legalForm && <span className="br-error br-error--show">{errors.legalForm}</span>}
        </div>

        <div className="br-field-group">
          <label className="br-label">Business Locations</label>
          {form.locations.map((locationValue, index) => (
            <div className="br-location-row" key={`location-${index}`}>
              <CityAutocompleteField
                inputClassName={`br-input ${errors.locations ? "br-input--error" : ""}`}
                placeholder={index === 0 ? "Main location (e.g. Algiers)" : `Location ${index + 1}`}
                value={locationValue}
                onChange={(nextValue) => updateLocationField(index, nextValue)}
              />
              <button
                className="br-location-remove"
                type="button"
                onClick={() => removeLocationField(index)}
                disabled={form.locations.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button className="br-location-add" type="button" onClick={addLocationField}>
            Add Location
          </button>
          <span className="br-location-hint">The first location will be used as the main location.</span>
          {errors.locations && <span className="br-error br-error--show">{errors.locations}</span>}
        </div>

        <div className="br-field-group">
          <label className="br-label" htmlFor="business-profile-photo-m">Profile Photo (optional)</label>
          <label className="br-upload-box" htmlFor="business-profile-photo-m">
            <span className="br-upload-main">Choose profile photo</span>
            <span className="br-upload-sub">PNG, JPG, WEBP</span>
          </label>
          <input
            id="business-profile-photo-m"
            className="br-file-input"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {photoFile ? <span className="br-upload-selected">Selected: {photoFile.name}</span> : null}
        </div>

        <div className="br-spacer" />

        {submitError && <span className="br-error br-error--show">{submitError}</span>}

        <button className="br-next-btn" onClick={handleNext} disabled={submitting} type="button">
          {submitting ? "Saving..." : "Next"}
        </button>

        <p className="br-login-text">
          Already have an account?{" "}
          <button type="button" className="br-login-link" onClick={onLogin}>Log in</button>
        </p>
      </div>

      {/* ============ DESKTOP-ONLY split layout ============ */}
      <div className="br-desktop-only">
        {/* Top nav bar */}
        <nav className="br-topnav">
          <div className="br-topnav-brand">Wesselli</div>

          <div className="br-topnav-links">
            <button type="button" className="br-topnav-link br-topnav-link--active">Main Page</button>
            <button type="button" className="br-topnav-link">Terms of Service</button>
            <button type="button" className="br-topnav-link">Security</button>
            <button type="button" className="br-topnav-link">Contact</button>
          </div>

          <div className="br-topnav-right">
            <span className="br-topnav-theme"><ThemeToggle /></span>
            <button type="button" className="br-topnav-login" onClick={onLogin}>Login</button>
            <button type="button" className="br-topnav-cta" onClick={onGetStarted || onLogin}>Get Started</button>
          </div>
        </nav>

        <div className="br-desktop-body">
          {/* LEFT: green hero panel with truck */}
          <aside className="br-left-panel">
            <div className="br-hero">
              <div className="br-hero-top">
                <SmallTruckIcon />
                <h2 className="br-hero-brand">Wesselli</h2>
                <p className="br-hero-desc">
                  The trusted bridge between professional truck drivers and businesses,
                  ensuring smooth and reliable freight delivery nationwide. With
                  precision tracking and verified reliability, every shipment is handled
                  efficiently and delivered with confidence.
                </p>
              </div>

              <img
                src="/truck.png"
                alt="Wesselli delivery truck"
                className="br-hero-truck-img"
              />

              <div className="br-hero-bottom">
                <span>New to Wesselli?</span>
                <button className="br-hero-login" onClick={onGetStarted || onLogin} type="button">
                  Create an Account
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT: form panel */}
          <section className="br-right-panel">
            <div className="br-card br-card--desktop">
              <h1 className="br-title">Create Business Account</h1>
              <p className="br-subtitle">Enter your business details.</p>
              {FormBody}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
