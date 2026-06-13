import React from "react";
import { AlertCircle, X } from "lucide-react";
import "./SubscriptionLimitModal.css";

export default function SubscriptionLimitModal({ 
  isOpen, 
  onClose, 
  errorCode, 
  message,
  onUpgrade 
}) {
  if (!isOpen) return null;

  const getErrorDetails = () => {
    switch (errorCode) {
      case "NO_SHIPMENT_POSTS":
        return {
          title: "Shipment Limit Reached",
          description: "You have reached your maximum number of shipments for this month.",
          icon: "📦",
          actionText: "Upgrade Plan"
        };
      case "NO_ROUTE_POSTS":
        return {
          title: "Route Limit Reached",
          description: "You have reached your maximum number of routes for this month.",
          icon: "🛣️",
          actionText: "Upgrade Plan"
        };
      case "NO_CONTACTS":
        return {
          title: "Contact Limit Reached",
          description: "You have reached your maximum number of contacts for this tier.",
          icon: "👥",
          actionText: "Upgrade Plan"
        };
      default:
        return {
          title: "Subscription Limit",
          description: message || "You have reached your limit.",
          icon: "⚠️",
          actionText: "Upgrade Plan"
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div className="subscription-limit-overlay" onClick={onClose}>
      <div className="subscription-limit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="subscription-limit-close" onClick={onClose} type="button">
          <X size={20} />
        </button>

        {/* Content */}
        <div className="subscription-limit-content">
          {/* Icon */}
          <div className="subscription-limit-icon">
            <span className="subscription-limit-emoji">{details.icon}</span>
            <AlertCircle className="subscription-limit-alert-icon" size={24} />
          </div>

          {/* Title */}
          <h2 className="subscription-limit-title">{details.title}</h2>

          {/* Description */}
          <p className="subscription-limit-description">
            {details.description}
          </p>

          {/* Message from Server */}
          {message && (
            <div className="subscription-limit-message">
              <strong>Details:</strong> {message}
            </div>
          )}

          {/* Info Box */}
          <div className="subscription-limit-info-box">
            <p>Upgrade your subscription plan to create more posts and manage more contacts.</p>
          </div>

          {/* Actions */}
          <div className="subscription-limit-actions">
            <button 
              className="subscription-limit-btn subscription-limit-btn-secondary" 
              onClick={onClose}
              type="button"
            >
              Close
            </button>
            <button 
              className="subscription-limit-btn subscription-limit-btn-primary" 
              onClick={onUpgrade}
              type="button"
            >
              {details.actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
