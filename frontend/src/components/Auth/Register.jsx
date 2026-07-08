import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import AuthCard from './AuthCard';
import { IconUserAdd } from '../icons';

// Password rules used for both live validation and the strength meter below.
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /\d/.test(p), label: 'At least one number' },
  { test: (p) => /[a-zA-Z]/.test(p), label: 'At least one letter' },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'At least one special character (!@#$%^&*)' },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Weak', color: 'text-red-500', bar: 'bg-red-500' };
  const score = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500', bar: 'bg-red-500' };
  if (score === 3) return { score, label: 'Medium', color: 'text-amber-500', bar: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'text-emerald-500', bar: 'bg-emerald-500' };
};

const Register = () => {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const failedRules = PASSWORD_RULES.filter((r) => !r.test(formData.password)).map((r) => r.label.replace('At least ', ''));
    if (failedRules.length) {
      setError(`Password must have: ${failedRules.join(', ')}`);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword: _confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (result.success) {
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const strength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <AuthCard icon={<IconUserAdd size={22} />} title="Create Account" subtitle="Join the Lost & Found System" error={error} message={message}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="lux-label">Full Name</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="lux-input" placeholder="Enter your full name" required disabled={loading} />
        </div>

        <div className="mb-4">
          <label className="lux-label">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="lux-input" placeholder="Enter your email" required disabled={loading} />
        </div>

        <div className="mb-4">
          <label className="lux-label">Phone Number (Optional)</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="lux-input" placeholder="Enter your phone number" disabled={loading} />
        </div>

        <div className="mb-4">
          <label className="lux-label">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="lux-input" placeholder="Enter your password" required disabled={loading} />

          {formData.password && (
            <div className="mt-3 space-y-1.5 animate-fade-in">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(formData.password);
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    <span className={passed ? 'text-emerald-500' : 'text-red-500'}>{passed ? '✅' : '❌'}</span>
                    <span className={passed ? 'text-emerald-400' : 'text-ink-400'}>{rule.label}</span>
                  </div>
                );
              })}

              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-400">Password Strength:</span>
                  <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
                </div>
                <div className="w-full h-2 bg-ink-100 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.bar}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="lux-label">Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="lux-input" placeholder="Confirm your password" required disabled={loading} />
          {formData.confirmPassword && formData.password && (
            <p className={`text-xs mt-1 ${passwordsMatch ? 'text-emerald-500' : 'text-red-500'}`}>
              {passwordsMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="lux-button w-full">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-ink-500 text-sm">
        Already have an account? <Link to="/login" className="lux-link">Login</Link>
      </p>

      <div className="mt-4 p-3 bg-ink-50 rounded-xl">
        <p className="text-xs text-ink-500 text-center">
          🔒 Password must be at least 8 characters and contain:
          <br />
          <span className="text-[10px]">• At least one number • At least one letter • At least one special character (!@#$%^&*)</span>
        </p>
      </div>
    </AuthCard>
  );
};

export default Register;
