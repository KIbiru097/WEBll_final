import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import AuthCard from './AuthCard';
import { IconLogin } from '../icons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <AuthCard icon={<IconLogin size={22} />} title="Welcome back" subtitle="Sign in to manage your reports and claims" error={error}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="lux-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="lux-input" required />
        </div>

        <div className="mb-6">
          <label className="lux-label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="lux-input" required />
        </div>

        <button type="submit" disabled={loading} className="lux-button w-full">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-5 text-center space-y-2">
        <p><Link to="/forgot-password" className="lux-link text-sm">Forgot Password?</Link></p>
        <p className="text-ink-500 text-sm">
          Don't have an account? <Link to="/register" className="lux-link">Register</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export default Login;
