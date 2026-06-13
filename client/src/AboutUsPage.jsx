import ThemeToggle from "./ThemeToggle";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import logo from "./photo/Logo.svg";
import "./AboutUsPage.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function AboutUsPage({ onBack }) {
  const socialAccounts = [
    {
      label: "Instagram",
      handle: "wesselli",
      url: "https://instagram.com/wesselli",
      icon: Instagram,
    },
    {
      label: "Facebook",
      handle: "wesselli",
      url: "https://facebook.com/wesselli",
      icon: Facebook,
    },
    {
      label: "LinkedIn",
      handle: "wesselli",
      url: "https://linkedin.com/company/wesselli",
      icon: Linkedin,
    },
  ];

  const values = [
    {
      title: "Reliable matching",
      body: "We use clear shipment details and availability signals to connect the right carrier with the right load.",
    },
    {
      title: "Transparent pricing",
      body: "Quotes are easy to understand, with simple terms that help both shippers and truckers plan with confidence.",
    },
    {
      title: "Real operations",
      body: "Tools are built around day-to-day logistics workflows, not just dashboards and charts.",
    },
  ];

  const stats = [
    { label: "Active regions", value: "12" },
    { label: "Partner carriers", value: "450+" },
    { label: "Shipments per week", value: "1.8k" },
  ];

  return (
    <div className="about-screen">
      <div className="about-container">
        <div className="about-header">
          <button className="about-back-btn" onClick={onBack} type="button">
            <BackIcon />
          </button>
          <h1 className="about-title">About Wesselli</h1>
          <ThemeToggle />
        </div>

        <div className="about-body">
          <section className="about-hero">
            <div className="about-hero-copy">
              <p className="about-eyebrow">Logistics without friction</p>
              <h2 className="about-hero-title">We make freight coordination simple and fast.</h2>
              <p className="about-hero-text">
                Wesselli is a multi-sided digital platform designed to help delivery operations for
                small and medium businesses as well as independent truckers.
              </p>
              <p className="about-hero-text">
                We connect shippers with trusted carriers to move goods across Algeria with clarity,
                speed, and accountability.
              </p>
            </div>

            <div className="about-hero-card">
              <div className="about-logo-wrap">
                <img src={logo} alt="Wesselli logo" className="about-logo" />
              </div>
              <div className="about-hero-meta">
                <div>
                  <span className="about-hero-meta-label">Focus</span>
                  <span className="about-hero-meta-value">Regional delivery</span>
                </div>
                <div>
                  <span className="about-hero-meta-label">Network</span>
                  <span className="about-hero-meta-value">SMBs and independent truckers</span>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section about-section--mission">
            <div>
              <h3 className="about-section-title">Our mission</h3>
              <p className="about-text">
                Build a dependable logistics layer for businesses that need visibility, predictable
                delivery windows, and direct communication with their carriers.
              </p>
            </div>
            <div className="about-pill">Trusted by growing logistics teams</div>
          </section>

          <section className="about-section about-section--values">
            <h3 className="about-section-title">What we stand for</h3>
            <div className="about-values-grid">
              {values.map((value) => (
                <div key={value.title} className="about-value-card">
                  <h4 className="about-value-title">{value.title}</h4>
                  <p className="about-value-text">{value.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section about-section--stats">
            <h3 className="about-section-title">Momentum</h3>
            <div className="about-stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="about-stat-card">
                  <span className="about-stat-value">{stat.value}</span>
                  <span className="about-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="about-social-card">
            <h2 className="about-social-title">Find us online</h2>
            <div className="about-social-list">
              {socialAccounts.map((account) => (
                <a
                  key={account.label}
                  className="about-social-item"
                  href={account.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="about-social-left">
                    <span className="about-social-icon" aria-hidden="true">
                      <account.icon size={15} strokeWidth={2.2} />
                    </span>
                    <span className="about-social-platform">{account.label}</span>
                  </span>
                  <span className="about-social-handle">@{account.handle}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
