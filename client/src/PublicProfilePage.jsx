import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import { getPublicProfile } from "./services/profileService";
import { addContact, sendMessage, getContacts } from "./services/chatService";
import { toastError, toastSuccess } from "./services/toastService";
import { resolveMediaUrl } from "./utils/media";
import "./Shipmentdetails.css";
import "./PublicProfilePage.css";

const AvatarPlaceholder = () => (
  <div
    style={{
      width: 96,
      height: 96,
      borderRadius: "50%",
      background: "rgba(16, 185, 129, 0.12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="var(--app-green-dark)" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--app-green-dark)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

function PublicProfilePageContent({ userId, onBack, onNavigate }) {
  const { userData } = useUser();
  const userName = userData?.name || "User";
  const userRole = userData?.role || "USER";
  const userPhoto = userData?.photo || "";

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [isContactAdded, setIsContactAdded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!error) return;
    toastError(error);
  }, [error]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getPublicProfile(userId);
        if (!isMounted) return;
        setProfile(result);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load profile");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (userId != null) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const checkContact = async () => {
      try {
        const contacts = await getContacts();
        if (!isMounted) return;
        const isAlreadyContact = contacts.some((c) => c.contactRel?.id === userId || c.contactOf === userId);
        setIsContactAdded(isAlreadyContact);
      } catch {
      }
    };

    if (userId != null) {
      checkContact();
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleAddContact = async () => {
    try {
      setContactLoading(true);
      await addContact(userId);
      setIsContactAdded(true);
      toastSuccess("Contact added successfully!");
    } catch (err) {
      if (err && (err.code === "CONTACT_EXISTS" || String(err.message).toLowerCase().includes("contact already added"))) {
        setIsContactAdded(true);
        toastSuccess("Contact already exists");
        return;
      }

      toastError(err?.message || "Failed to add contact");
    } finally {
      setContactLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      setContactLoading(true);
      if (!isContactAdded) {
        try {
          await addContact(userId);
          setIsContactAdded(true);
        } catch (err) {
          if (err && (err.code === "CONTACT_EXISTS" || String(err.message).toLowerCase().includes("contact already added"))) {
            setIsContactAdded(true);
          } else {
            throw err;
          }
        }
      }
      await sendMessage(userId, "Hi, I'd like to start a conversation!", null);
      toastSuccess("Message sent! Opening chat...");
      if (onNavigate) {
        onNavigate("chat", { userId });
      }
    } catch (err) {
      toastError(err?.message || "Failed to send message");
    } finally {
      setContactLoading(false);
    }
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else if (tab === "shipments") onNavigate?.("shipments");
    else if (tab === "routes") onNavigate?.("routes");
    else if (tab === "profile") onNavigate?.("profile");
    else if (tab === "chat") onNavigate?.("chat");
    else onNavigate?.(tab);
  };

  const profileContent = (
    <>
      {loading ? <div className="sd-id-row"><h1 className="sd-id">Loading profile...</h1></div> : null}
      {!loading && error ? <div className="sd-id-row"><h1 className="sd-id">{error}</h1></div> : null}

      {!loading && !error && profile ? (
        <div className="pp-desktop-split">
          {/* LEFT COLUMN: Avatar + Name + Info Cards */}
          <div className="pp-desktop-left">
            <div className="pp-hero-section">
              <div className="pp-hero-avatar-wrap-interactive">
                {profile?.profile_Photo ? (
                  <img
                    src={resolveMediaUrl(profile.profile_Photo)}
                    alt={profile.displayName}
                    className="pp-hero-avatar pp-hero-avatar-large pp-hero-avatar-anim"
                  />
                ) : (
                  <AvatarPlaceholder />
                )}
              </div>
              
              <div className="pp-name-section sd-sender-info" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                <span className="sd-sender-label">NAME</span>
                <span className="sd-sender-name" style={{ fontSize: '20px', fontWeight: '700' }}>{profile.displayName}</span>
              </div>

              <div className="pp-badge-section">
                <button className="sd-msg-btn pp-type-pill-interactive pp-type-pill" type="button" aria-label="Type" style={{ cursor: 'default' }}>
                  {String(profile?.type || "USER")}
                </button>
              </div>
            </div>

            <div className="pp-cards-grid">
              <div className="pp-info-card-interactive pp-info-card-anim">
                <div className="pp-info-top">
                  <span className="pp-info-label">EMAIL</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <p className="pp-info-value">{profile.email || "Not shared"}</p>
              </div>

              <div className="pp-info-card-interactive pp-info-card-anim">
                <div className="pp-info-top">
                  <span className="pp-info-label">PHONE</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L9.1 10.6a16 16 0 0 0 4.3 4.3l1.15-1.18a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="pp-info-value">{profile.phone || "Not shared"}</p>
              </div>

              <div className="pp-info-card-interactive pp-info-card-anim">
                <div className="pp-info-top">
                  <span className="pp-info-label">LOCATION</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s7-7.75 7-13a7 7 0 1 0-14 0c0 5.25 7 13 7 13z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <p className="pp-info-value">{profile.location || "Not shared"}</p>
              </div>

              {String(profile?.type || "").toUpperCase() === "BUSINESS" && Array.isArray(profile?.additional_locations) && profile.additional_locations.length > 0 ? (
                <div className="pp-info-card-interactive pp-info-card--wide-interactive pp-info-card-anim">
                  <div className="pp-info-top">
                    <span className="pp-info-label">OTHER LOCATIONS</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22s7-7.75 7-13a7 7 0 1 0-14 0c0 5.25 7 13 7 13z" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="pp-info-value">{profile.additional_locations.join(" • ")}</p>
                </div>
              ) : null}

              <div className="pp-info-card-interactive pp-info-card-anim">
                <div className="pp-info-top">
                  <span className="pp-info-label">WORKING TIME</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="pp-info-value">{profile.working_Time || "Not shared"}</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Contact Section */}
          <div className="pp-desktop-right">
            <div className="pp-contact-card pp-contact-card-anim pp-contact-card--sticky">
              <div className="pp-contact-content">
                <h3 className="pp-contact-title">Connect</h3>
                <p className="pp-contact-subtitle">Start a conversation with this user</p>
              </div>
              <div className="pp-contact-actions">
                <button
                  className="pp-contact-btn pp-contact-btn--primary"
                  onClick={handleSendMessage}
                  disabled={contactLoading}
                  type="button"
                >
                  {contactLoading ? "Loading..." : "Send Message"}
                </button>
                {!isContactAdded && (
                  <button
                    className="pp-contact-btn pp-contact-btn--secondary"
                    onClick={handleAddContact}
                    disabled={contactLoading}
                    type="button"
                  >
                    {contactLoading ? "Loading..." : "Add Contact"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {/* ── Mobile Layout ── */}
      <div className="sd-screen sd-show-mobile">
        <div className={`sd-container ${mounted ? "sd-container--visible" : ""}`}>
          <div className="sd-header">
            <button className="sd-back-btn pp-back-btn-interactive" onClick={onBack} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="sd-title">User Profile</h2>
            <ThemeToggle />
          </div>
          <div className="sd-body">
            {profileContent}
          </div>
        </div>
      </div>

      {/* ── Desktop Layout ── */}
      <div className="sd-desktop-layout sd-show-desktop">
        <Sidebar activeNav="routes" onNavigate={handleSidebarNav} userRole={userRole} />
        <div className="sd-desktop-main">
          <Header userName={userName} userRole={userRole} userPhoto={userPhoto} onNavigate={onNavigate} />
          <div className="sd-desktop-content">
            <div className="sd-desktop-content-inner">
              <div className="sd-desktop-page-header">
                <button className="sd-desktop-back" onClick={onBack} type="button"><ArrowLeft size={18} /></button>
                <h2 className="sd-desktop-page-title">User Profile</h2>
              </div>
              <div className="sd-body">
                {profileContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PublicProfilePage(props) {
  return (
    <UserProvider>
      <PublicProfilePageContent {...props} />
    </UserProvider>
  );
}
