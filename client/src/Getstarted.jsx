import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  Briefcase,
  ShieldCheck,
  MapPin,
  Mail,
  Instagram,
  Truck,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import './Getstarted.css';
import driverImg from './photo/driverimg.jpg';
import logoSvg from './photo/Logo.svg';

const LandingPage = ({ onGetStarted, onLogin }) => {
  return (
    <>
      {/* ============================================================
          MOBILE — original layout (unchanged)
          ============================================================ */}
      <div className="gs-container">
        <header className="gs-header">
          <div className="gs-logo-box">
            <img src={logoSvg} alt="Wesselli" className="gs-logo-img" />
          </div>
          <span className="gs-brand">Wesselli</span>
          <ThemeToggle />
        </header>

        <div className="gs-hero">
          <div className="gs-image-wrapper">
            <img src={driverImg} alt="Driver" className="gs-image" />
            <div className="gs-badge">
              <CheckCircle size={13} strokeWidth={2.5} />
              <span>VERIFIED CARRIERS</span>
            </div>
          </div>
        </div>

        <main className="gs-content">
          <h2 className="gs-title">Seamless Logistics</h2>
          <p className="gs-description">
            Connecting truckers and businesses for fast, reliable deliveries across Algeria.
          </p>
        </main>

        <footer className="gs-actions">
          <button className="gs-btn-primary" onClick={onGetStarted}>
            Get Started
            <span className="gs-arrow"><ArrowRight size={20} strokeWidth={2.5} /></span>
          </button>
          <button className="gs-btn-secondary" onClick={onLogin}>
            Log In
          </button>
        </footer>
      </div>

      {/* ============================================================
          DESKTOP — full landing page (≥ 992px)
          ============================================================ */}
      <div className="gs-desktop">
        {/* Top nav */}
        <header className="gs-topnav">
          <div className="gs-topnav-brand">Wesselli</div>

          <nav className="gs-topnav-links">
            <span className="gs-topnav-link gs-topnav-link--active">Main Page</span>
            <span className="gs-topnav-link">Terms of Service</span>
            <span className="gs-topnav-link">Security</span>
            <span className="gs-topnav-link">Contact</span>
          </nav>

          <div className="gs-topnav-right">
            <div className="gs-topnav-theme">
              <ThemeToggle />
            </div>
            <button type="button" className="gs-topnav-login" onClick={onLogin}>Login</button>
            <button type="button" className="gs-topnav-cta" onClick={onGetStarted}>Get Started</button>
          </div>
        </header>

        {/* Hero */}
        <section className="gs-hero-section">
          <div className="gs-hero-left">
            <h1 className="gs-hero-headline">
              Connecting<br />
              <span className="gs-hero-headline-accent">Algeria's</span><br />
              Logistics<br />
              Network
            </h1>
            <p className="gs-hero-desc">
              The bridge between professional truckers and businesses.
              Seamless freight delivery across the country with precision tracking
              and verified reliability.
            </p>
            <div className="gs-hero-ctas">
              <button type="button" className="gs-hero-cta-primary" onClick={onGetStarted}>
                Get Started
              </button>
              <button type="button" className="gs-hero-cta-secondary" onClick={onLogin}>
                Login
              </button>
            </div>
            <div className="gs-hero-stats">
              <div>
                <p className="gs-stat-num">2,500+</p>
                <p className="gs-stat-label">Verified Carriers</p>
              </div>
              <div>
                <p className="gs-stat-num">69</p>
                <p className="gs-stat-label">Wilayas Covered</p>
              </div>
              <div>
                <p className="gs-stat-num">15k+</p>
                <p className="gs-stat-label">Shipments Moved</p>
              </div>
            </div>
          </div>

          <div className="gs-hero-right">
            <div className="gs-hero-card">
              <img src="/welcome.png" alt="Truck on the road" className="gs-hero-card-img gs-hero-card-img--animated" />
              <div className="gs-hero-card-meta">
                <span className="gs-hero-card-meta-label">LIVE SHIPMENT</span>
                <span className="gs-hero-card-meta-tag">IN TRANSIT</span>
              </div>
              <div className="gs-hero-card-status">
                <div className="gs-hero-card-status-icon">
                  <Truck size={18} strokeWidth={2.2} />
                </div>
                <div className="gs-hero-card-status-text">
                  <span className="gs-hero-card-status-title">Headed to Adrar</span>
                  <span className="gs-hero-card-status-sub">Estimated arrival: 2h 15m</span>
                </div>
              </div>
              <div className="gs-hero-card-route">
                <div className="gs-route-row">
                  <span className="gs-route-dot gs-route-dot--green" />
                  <div className="gs-route-text">
                    <span className="gs-route-title">Algiers Port</span>
                    <span className="gs-route-sub">Pick-up completed · 06:30 AM</span>
                  </div>
                </div>
                <div className="gs-route-row">
                  <span className="gs-route-dot gs-route-dot--muted" />
                  <div className="gs-route-text">
                    <span className="gs-route-title">Adrar</span>
                    <span className="gs-route-sub">Scheduled delivery · 02:45 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="gs-features-section">
          <div className="gs-features-inner">
            <p className="gs-features-tag">Our Platform</p>
            <h2 className="gs-features-title">Precision Logistics for Everyone</h2>
            <p className="gs-features-sub">
              Whether you're moving heavy industrial equipment or small commercial loads, Wesselli
              provides the tools to manage your supply chain with ease.
            </p>

            <div className="gs-features-grid">
              <article className="gs-feature">
                <div className="gs-feature-icon">
                  <Briefcase size={22} strokeWidth={2.2} />
                </div>
                <h3 className="gs-feature-title">For Businesses</h3>
                <p className="gs-feature-desc">
                  Post shipments in seconds, compare quotes from top carriers, and track your cargo
                  in real-time with GPS accuracy.
                </p>
                <ul className="gs-feature-list">
                  <li><CheckCircle size={14} strokeWidth={2.5} /> Automated Invoicing</li>
                  <li><CheckCircle size={14} strokeWidth={2.5} /> Route Optimization</li>
                </ul>
                <button type="button" className="gs-feature-link" onClick={onGetStarted}>
                  Post a Load <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </article>

              <article className="gs-feature">
                <div className="gs-feature-icon">
                  <Truck size={22} strokeWidth={2.2} />
                </div>
                <h3 className="gs-feature-title">For Truckers</h3>
                <p className="gs-feature-desc">
                  Access high-value loads across Algeria. Fill your backhauls and maximize your
                  revenue with our smart load matching.
                </p>
                <ul className="gs-feature-list">
                  <li><CheckCircle size={14} strokeWidth={2.5} /> Fast Digital Payments</li>
                  <li><CheckCircle size={14} strokeWidth={2.5} /> 24/7 Roadside Support</li>
                </ul>
                <button type="button" className="gs-feature-link" onClick={onGetStarted}>
                  Find Loads <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </article>

              <article className="gs-feature">
                <div className="gs-feature-icon">
                  <ShieldCheck size={22} strokeWidth={2.2} />
                </div>
                <h3 className="gs-feature-title">Reliability</h3>
                <p className="gs-feature-desc">
                  Secure payments and verified professional partners. Every carrier is vetted for
                  insurance and safety compliance.
                </p>
                <ul className="gs-feature-list">
                  <li><CheckCircle size={14} strokeWidth={2.5} /> Insurance Protection</li>
                  <li><CheckCircle size={14} strokeWidth={2.5} /> Background Checks</li>
                </ul>
                <button type="button" className="gs-feature-link" onClick={onGetStarted}>
                  Our Standards <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="gs-footer">
          <div className="gs-footer-left">
            <span className="gs-footer-brand">Wesselli</span>
            <span className="gs-footer-copy">
              © 2025 WESSELLI LOGISTICS · CONNECTING ALGERIA'S SUPPLY CHAIN
            </span>
          </div>
          <div className="gs-footer-links">
            <span className="gs-footer-link">Privacy Policy</span>
            <span className="gs-footer-link">Terms of Service</span>
            <span className="gs-footer-link">Carrier Agreement</span>
            <span className="gs-footer-link">Contact Us</span>
            <div className="gs-footer-icons">
              <button type="button" className="gs-footer-icon" aria-label="Instagram">
                <Instagram size={14} />
              </button>
              <button type="button" className="gs-footer-icon" aria-label="Email">
                <Mail size={14} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
