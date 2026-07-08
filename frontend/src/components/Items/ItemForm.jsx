import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { IconLost, IconFound } from '../icons';

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Documents', 'Keys', 'Bags', 'Other'];

// One form drives both "Report Lost" and "Report Found" — only labels/fields/endpoint differ.
const CONFIG = {
  lost: {
    endpoint: '/lost-items',
    title: 'Report Lost Item',
    subtitle: 'Give as much detail as possible to help others find it.',
    locationField: 'location_lost',
    locationLabel: 'Location Lost',
    dateField: 'date_lost',
    dateLabel: 'Date Lost',
    tint: 'from-ink-700 to-ink-800',
    icon: <IconLost size={20} className="text-white" />,
  },
  found: {
    endpoint: '/found-items',
    title: 'Report Found Item',
    subtitle: "Help someone get their item back.",
    locationField: 'location_found',
    locationLabel: 'Location Found',
    dateField: 'date_found',
    dateLabel: 'Date Found',
    tint: 'from-accent-500 to-accent-600',
    icon: <IconFound size={20} className="text-white" />,
  },
};

const ItemForm = ({ type }) => {
  const { endpoint, title, subtitle, locationField, locationLabel, dateField, dateLabel, tint, icon } = CONFIG[type];
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ item_name: '', category: '', description: '', [locationField]: '', [dateField]: '' });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
    if (image) payload.append('image', image);

    try {
      await api.post(endpoint, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || `Could not report ${type} item`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-scale-in">
      <div className="lux-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className={`icon-tile bg-gradient-to-br ${tint} shadow-soft`}>
            {icon}
          </span>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink-900">{title}</h1>
            <p className="text-sm text-ink-400">{subtitle}</p>
          </div>
        </div>

        {error && <div className="lux-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="lux-label">Item Name</label>
            <input type="text" name="item_name" value={formData.item_name} onChange={handleChange} className="lux-input" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="lux-label">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="lux-input" required>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="lux-label">{dateLabel}</label>
              <input type="date" name={dateField} value={formData[dateField]} onChange={handleChange} className="lux-input" required />
            </div>
          </div>

          <div>
            <label className="lux-label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="lux-input" placeholder="Color, brand, distinguishing marks..." />
          </div>

          <div>
            <label className="lux-label">{locationLabel}</label>
            <input type="text" name={locationField} value={formData[locationField]} onChange={handleChange} className="lux-input" required />
          </div>

          <div>
            <label className="lux-label">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="lux-input file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer cursor-pointer"
            />
          </div>

          <button type="submit" disabled={loading} className="lux-button w-full">
            {loading ? 'Submitting...' : `Submit ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
