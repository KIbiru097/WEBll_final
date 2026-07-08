import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const result = await updateProfile(profileData);
    if (result.success) {
      setMessage('Profile updated successfully');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const result = await changePassword(passwordData.current_password, passwordData.new_password);
    if (result.success) {
      setMessage('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '' });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white text-xl font-display font-bold shadow-soft">
          {(user?.full_name || 'U').trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-3xl font-display font-bold text-ink-900">Profile</h1>
          <p className="text-ink-500 text-sm">{user?.email}</p>
        </div>
      </div>

      {message && <div className="lux-alert-success">{message}</div>}
      {error && <div className="lux-alert-error">{error}</div>}

      <div className="lux-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-ink-900">Account Details</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="lux-label">Full Name</label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(event) => setProfileData({ ...profileData, full_name: event.target.value })}
              className="lux-input"
              required
            />
          </div>
          <div>
            <label className="lux-label">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="lux-input"
              disabled
            />
          </div>
          <div>
            <label className="lux-label">Phone</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(event) => setProfileData({ ...profileData, phone: event.target.value })}
              className="lux-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="lux-button"
          >
            Save Profile
          </button>
        </form>
      </div>

      <div className="lux-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-ink-900">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="lux-label">Current Password</label>
            <input
              type="password"
              value={passwordData.current_password}
              onChange={(event) => setPasswordData({ ...passwordData, current_password: event.target.value })}
              className="lux-input"
              required
            />
          </div>
          <div>
            <label className="lux-label">New Password</label>
            <input
              type="password"
              value={passwordData.new_password}
              onChange={(event) => setPasswordData({ ...passwordData, new_password: event.target.value })}
              className="lux-input"
              required
              minLength="6"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="lux-button-secondary"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
