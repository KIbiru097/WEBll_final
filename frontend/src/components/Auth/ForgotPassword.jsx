import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AuthCard from './AuthCard';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard icon="📧" title="Check Your Email">
        <p className="text-ink-500 mb-4 text-center">
          We've sent a password reset link to:
          <br />
          <strong className="text-ink-900">{email}</strong>
        </p>
        <div className="bg-ink-50 p-4 rounded-xl text-sm text-ink-500 mb-6 text-left space-y-1">
          <p>📧 Please check your inbox and spam folder.</p>
          <p>⏰ The link will expire in 1 hour.</p>
        </div>
        <Link to="/login" className="lux-button inline-flex w-full justify-center">Back to Login</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon="🔐" title="Forgot Password" subtitle="Enter your email and we'll send you a link to reset your password." error={error}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="lux-label">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="lux-input" placeholder="Enter your email" required disabled={loading} />
        </div>
        <button type="submit" disabled={loading} className="lux-button w-full">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-5 text-center text-ink-500 text-sm">
        <Link to="/login" className="lux-link">Back to Login</Link>
        {' · '}
        <Link to="/register" className="lux-link">Create Account</Link>
      </p>
    </AuthCard>
  );
};

export default ForgotPassword;
