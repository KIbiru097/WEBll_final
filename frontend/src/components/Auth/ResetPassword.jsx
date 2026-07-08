import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AuthCard from './AuthCard';

const validatePassword = (password) => {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/\d/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter' };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  return { valid: true };
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setValidToken(false);
      setError('No reset token provided');
    }
    setVerifying(false);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-display font-semibold text-ink-900">Verifying Token...</h2>
        </div>
      </AuthCard>
    );
  }

  if (!validToken) {
    return (
      <AuthCard icon="❌" title="Invalid Reset Link">
        <p className="text-ink-500 mb-6 text-center">The password reset link is invalid or has expired.</p>
        <div className="flex flex-col gap-3">
          <Link to="/forgot-password" className="lux-button inline-flex justify-center">Request New Link</Link>
          <Link to="/login" className="lux-link text-center">Back to Login</Link>
        </div>
      </AuthCard>
    );
  }

  if (message.includes('successful')) {
    return (
      <AuthCard icon="✅" title="Password Reset Success!">
        <p className="text-ink-500 mb-6 text-center">{message}</p>
        <Link to="/login" className="lux-button inline-flex justify-center w-full">Go to Login</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon="🔑"
      title="Set New Password"
      subtitle={'Password must be at least 8 characters and contain:\n• At least one number  •  At least one letter  •  At least one special character (!@#$%^&*)'}
      error={error}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="lux-label">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="lux-input" placeholder="Enter new password" required disabled={loading} />
          {newPassword && (
            <p className="text-xs text-ink-400 mt-1.5">
              {newPassword.length >= 8 ? '✅' : '❌'} 8+ characters{' '}
              {/\d/.test(newPassword) ? '✅' : '❌'} Number{' '}
              {/[a-zA-Z]/.test(newPassword) ? '✅' : '❌'} Letter{' '}
              {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '✅' : '❌'} Special
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="lux-label">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="lux-input" placeholder="Confirm your new password" required disabled={loading} />
          {confirmPassword && newPassword && (
            <p className={`text-xs mt-1 ${confirmPassword === newPassword ? 'text-emerald-500' : 'text-red-500'}`}>
              {confirmPassword === newPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="lux-button w-full">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-5 text-center text-ink-500 text-sm">
        <Link to="/login" className="lux-link">Back to Login</Link>
      </p>
    </AuthCard>
  );
};

export default ResetPassword;
