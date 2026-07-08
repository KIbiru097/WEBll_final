import React from 'react';

// Every auth screen (Login, Register, Forgot/Reset Password, and their success/error
// sub-views) is the same shell: centered card, icon badge, title, subtitle, alerts,
// then page-specific content. Pulling that shell out here removes ~10 repeated lines
// per screen and keeps the alert styling consistent everywhere.
const AuthCard = ({ icon, title, subtitle, error, message, children }) => (
  <div className="max-w-md mx-auto animate-scale-in">
    <div className="lux-card p-8">
      {icon && (
        <div className="flex justify-center mb-5">
          <span className="icon-tile bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft text-xl">
            {icon}
          </span>
        </div>
      )}
      {title && <h2 className="text-2xl font-display font-bold text-center mb-1 text-ink-900">{title}</h2>}
      {subtitle && <p className="text-center text-sm text-ink-400 mb-6 whitespace-pre-line">{subtitle}</p>}

      {error && <div className="lux-alert-error">{error}</div>}
      {message && <div className="lux-alert-success">{message}</div>}

      {children}
    </div>
  </div>
);

export default AuthCard;
