



import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConfirmDialog from './ConfirmDialog';
import { deleteSubscription, getMySubscription, updateSubscription } from './services/subscriptionService';
import { createSubscriptionRequest, getMySubscriptionRequest } from './services/subscriptionRequestService';
import { toastError, toastSuccess } from './services/toastService';
import { SUBSCRIPTION_PLANS } from './subscriptionPlansData';
import { useUser } from './contexts/UserContext';
import './SubscriptionPlans.css';

const SubscriptionPlans = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [mySub, setMySub] = useState(null);
  const [myRequest, setMyRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingTier, setActionLoadingTier] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const attachmentRef = React.useRef(null);

  const plans = useMemo(() => SUBSCRIPTION_PLANS, []);

  /* ── dynamic user from localStorage ── */
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const displayName = userData.name || storedUser?.full_Name || storedUser?.business_Name || storedUser?.name || 'User';
  const userRole = userData.role || storedUser?.role || storedUser?.position || storedUser?.jobTitle || '';
  const userAvatar = userData.photo || storedUser?.profile_Photo || storedUser?.avatar || '';

  const loadMySubscription = async () => {
    setLoading(true);
    setError('');
    try {
      const [sub, req] = await Promise.all([
        getMySubscription(),
        getMySubscriptionRequest(),
      ]);
      setMySub(sub || null);
      setMyRequest(req || null);
    } catch (err) {
      setError(err?.message || 'Failed to load your subscription.');
      setMySub(null);
      setMyRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMySubscription(); }, []);
  useEffect(() => { if (!error) return; toastError(error); }, [error]);

  const handleBack = () => {
    if (onNavigate) { onNavigate('dashboard'); return; }
    navigate('/dashboard');
  };

  const handleSelectOrUpdate = async (plan) => {
    setError('');
    setActionLoadingTier(plan.tier);
    try {
      if (!mySub) {
        // Send a request to admin instead of creating directly
        const request = await createSubscriptionRequest(plan.tier, attachmentFile || undefined);
        setMyRequest(request);
        setAttachmentFile(null);
        toastSuccess('Request sent', { description: 'Your subscription request has been sent to the admin for approval.' });
      } else {
        const updated = await updateSubscription(mySub.sub_ID, {
          tier: plan.tier,
          isActive: true,
          endDate: mySub.endDate || null,
        });
        setMySub(updated);
        toastSuccess('Subscription updated');
      }
    } catch (err) {
      setError(err?.message || 'Failed to update subscription.');
    } finally {
      setActionLoadingTier('');
    }
  };

  const handleDelete = async () => {
    if (!mySub?.sub_ID) return;
    setDeleteLoading(true);
    setError('');
    try {
      await deleteSubscription(mySub.sub_ID);
      setMySub(null);
      toastSuccess('Subscription deleted');
    } catch (err) {
      setError(err?.message || 'Failed to delete subscription.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDetails = () => {
    if (!mySub?.sub_ID) return;
    onNavigate?.('subscriptionDetails', { subscriptionId: mySub.sub_ID, from: 'subscription' });
  };

  return (
    <div className="subscription-screen">
      {/* ── MOBILE CONTAINER ── */}
      <div className="subscription-container">
        <div className="subscription-header">
          <button className="subscription-back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="subscription-header-title">Subscription Plans</h1>
          <ThemeToggle />
        </div>

        <div className="subscription-body">
          {error ? <p className="subscription-error-banner">{error}</p> : null}

          <div className="subscription-title-section">
            <p className="subscription-main-subtitle">
              Choose your<br />momentum
            </p>
            <p className="subscription-description">
              Scale your logistics with precision vitality and industrial speed.
            </p>
            <p className="subscription-description" style={{ marginTop: 6 }}>
              {loading
                ? 'Loading your current subscription...'
                : mySub
                ? `Current tier: ${mySub.tier} (ID #${mySub.sub_ID})`
                : 'You have no active subscription yet.'}
            </p>

            {myRequest?.status === 'PENDING' && !mySub && (
              <div className="sp-pending-banner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Your <strong>{myRequest.tier}</strong> plan request is pending admin approval.</span>
              </div>
            )}

            {myRequest?.status === 'REJECTED' && !mySub && (
              <div className="sp-pending-banner sp-pending-banner--rejected">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Your <strong>{myRequest.tier}</strong> plan request was rejected. You may try again.</span>
              </div>
            )}

            {mySub && (
              <div className="subscription-top-actions">
                <button className="plan-action-btn plan-btn-select" onClick={openDetails} type="button">
                  View Details
                </button>
                <button
                  className="plan-action-btn plan-btn-upgrade"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deleteLoading}
                  type="button"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Subscription'}
                </button>
              </div>
            )}
          </div>

          {!mySub && myRequest?.status !== 'PENDING' && (
            <div className="sp-attachment-section">
              <p className="sp-attachment-label">Attach a document (optional)</p>
              <p className="sp-attachment-hint">Photo or PDF, max 5 MB — the admin will review it.</p>
              <input
                type="file"
                ref={attachmentRef}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) {
                    toastError('File must be under 5 MB');
                    e.target.value = '';
                    return;
                  }
                  setAttachmentFile(f);
                }}
              />
              <div className="sp-attachment-row">
                <button
                  type="button"
                  className="sp-attachment-btn"
                  onClick={() => attachmentRef.current?.click()}
                >
                  Choose File
                </button>
                {attachmentFile && (
                  <span className="sp-attachment-name">
                    {attachmentFile.name}
                    <button
                      type="button"
                      className="sp-attachment-remove"
                      onClick={() => setAttachmentFile(null)}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="plans-list">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`plan-card ${plan.recommended ? 'plan-card-recommended' : ''} ${plan.isBusiness ? 'plan-card-business' : ''}`}
              >
                {plan.recommended && (
                  <div className="plan-recommended-badge">RECOMMENDED</div>
                )}
                <div className="plan-price-corner">
                  <div className="plan-price-corner-wrapper">
                    <span className="plan-price-corner-main">{plan.price}</span>
                    {plan.priceBelow && (
                      <span className="plan-price-corner-below">{plan.priceBelow}</span>
                    )}
                  </div>
                </div>
                <div className="plan-card-content">
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                  <ul className="plan-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="plan-feature-item">
                        <span className="plan-feature-check">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`plan-action-btn ${plan.buttonVariant === 'current' ? 'plan-btn-current' : plan.buttonVariant === 'select' ? 'plan-btn-select' : 'plan-btn-upgrade'}`}
                    disabled={loading || actionLoadingTier === plan.tier || mySub?.tier === plan.tier || myRequest?.status === 'PENDING'}
                    onClick={() => handleSelectOrUpdate(plan)}
                    type="button"
                  >
                    {actionLoadingTier === plan.tier
                      ? 'Processing...'
                      : myRequest?.status === 'PENDING' && !mySub
                      ? 'Request Pending'
                      : mySub?.tier === plan.tier
                      ? 'Current Plan'
                      : mySub
                      ? `Update to ${plan.tier}`
                      : `Request ${plan.tier}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="subscription-desktop-wrap">
        <Sidebar activeNav="subscription" onNavigate={(tab) => {
          if (tab === 'home') handleBack();
          else if (tab === 'profile') onNavigate?.('profile');
          else if (tab === 'shipments') onNavigate?.('shipments');
          else if (tab === 'routes') onNavigate?.('routes');
          else if (tab === 'chat') onNavigate?.('chat');
          else if (tab === 'profileSettings') onNavigate?.('profileSettings');
          else if (tab === 'adminPanel') onNavigate?.('adminPanel');
          else onNavigate?.(tab);
        }} userRole={userRole} />

        <div className="sub-desktop-main">
          <Header
            userName={displayName}
            userRole={userRole}
            userPhoto={userAvatar}
            onNavigate={onNavigate}
          />

          <main className="sub-desktop-main-content">
        {error ? <p className="subscription-error-banner sub-desktop-error">{error}</p> : null}

        {/* Hero */}
        <section className="sub-desktop-hero">
          <h1 className="sub-desktop-hero-title">Choose your momentum</h1>
          <p className="sub-desktop-hero-sub">
            Scale your logistics with precision vitality and industrial speed. Choose the engine that drives your growth.
          </p>
          {mySub && (
            <div className="subscription-top-actions sub-desktop-top-actions">
              <button className="plan-action-btn plan-btn-select" onClick={openDetails} type="button" style={{ width: 'auto', padding: '10px 24px' }}>
                View Details
              </button>
              <button
                className="plan-action-btn plan-btn-upgrade"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleteLoading}
                type="button"
                style={{ width: 'auto', padding: '10px 24px' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Subscription'}
              </button>
            </div>
          )}
          <p className="sub-desktop-current-tier">
            {loading
              ? 'Loading your current subscription...'
              : mySub
              ? `Current tier: ${mySub.tier} (ID #${mySub.sub_ID})`
              : 'You have no active subscription yet.'}
          </p>

          {myRequest?.status === 'PENDING' && !mySub && (
            <div className="sp-pending-banner" style={{ maxWidth: 540, margin: '12px auto 0' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Your <strong>{myRequest.tier}</strong> plan request is pending admin approval.</span>
            </div>
          )}

          {myRequest?.status === 'REJECTED' && !mySub && (
            <div className="sp-pending-banner sp-pending-banner--rejected" style={{ maxWidth: 540, margin: '12px auto 0' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Your <strong>{myRequest.tier}</strong> plan request was rejected. You may try again.</span>
            </div>
          )}
        </section>

        {/* Attachment section for desktop */}
        {!mySub && myRequest?.status !== 'PENDING' && (
          <div className="sp-attachment-section sub-desktop-attachment">
            <p className="sp-attachment-label">Attach a document (optional)</p>
            <p className="sp-attachment-hint">Photo or PDF, max 5 MB — the admin will review it.</p>
            <input
              type="file"
              ref={attachmentRef}
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) {
                  toastError('File must be under 5 MB');
                  e.target.value = '';
                  return;
                }
                setAttachmentFile(f);
              }}
            />
            <div className="sp-attachment-row">
              <button
                type="button"
                className="sp-attachment-btn"
                onClick={() => attachmentRef.current?.click()}
              >
                Choose File
              </button>
              {attachmentFile && (
                <span className="sp-attachment-name">
                  {attachmentFile.name}
                  <button
                    type="button"
                    className="sp-attachment-remove"
                    onClick={() => setAttachmentFile(null)}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Plans grid */}
        <section className="sub-desktop-plans-grid">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`sub-desktop-plan-card ${plan.recommended ? 'sub-desktop-plan-recommended' : ''} ${plan.isBusiness ? 'sub-desktop-plan-business' : ''}`}
            >
              {plan.recommended && (
                <div className="sub-desktop-recommended-badge">Recommended</div>
              )}
              {plan.subtitle && (
                <div className="sub-desktop-plan-tag">{plan.subtitle}</div>
              )}

              <div className="sub-desktop-plan-name">{plan.name}</div>
              <div className="sub-desktop-plan-price">
                <span className="sub-desktop-price-main">{plan.price}</span>
                {plan.priceBelow && <span className="sub-desktop-price-below">{plan.priceBelow}</span>}
              </div>

              <ul className="sub-desktop-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="sub-desktop-feature-item">
                    <span className="sub-desktop-feature-icon">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`sub-desktop-plan-btn ${plan.buttonVariant === 'current' ? 'sub-desktop-btn-current' : plan.buttonVariant === 'select' ? 'sub-desktop-btn-select' : 'sub-desktop-btn-upgrade'}`}
                disabled={loading || actionLoadingTier === plan.tier || mySub?.tier === plan.tier || myRequest?.status === 'PENDING'}
                onClick={() => handleSelectOrUpdate(plan)}
                type="button"
              >
                {actionLoadingTier === plan.tier
                  ? 'Processing...'
                  : myRequest?.status === 'PENDING' && !mySub
                  ? 'Request Pending'
                  : mySub?.tier === plan.tier
                  ? 'Current Plan'
                  : mySub
                  ? `Update to ${plan.tier}`
                  : plan.buttonVariant === 'current'
                  ? 'Current Plan'
                  : plan.buttonVariant === 'select'
                  ? `Activate ${plan.name}`
                  : `Activate ${plan.name}`}
              </button>
            </div>
          ))}
        </section>

        {/* Banner */}
        <section className="sub-desktop-banner">
          <div className="sub-desktop-banner-content">
            <h2 className="sub-desktop-banner-title">Industrial Speed<br />Guaranteed</h2>
            <p className="sub-desktop-banner-text">
              Our infrastructure is built for scale. Whether you're sending one package or managing a global fleet, Wesselli provides the backbone for your success.
            </p>
          </div>
        </section>


          </main>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Subscription"
        message="Do you want to delete your current subscription?"
        confirmLabel="Yes"
        cancelLabel="No"
        loading={deleteLoading}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          await handleDelete();
          setConfirmDeleteOpen(false);
        }}
      />
    </div>
  );
};

export default SubscriptionPlans;