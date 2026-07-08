import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { buildAssetUrl } from '../../services/api';
import { IconClaims, IconFound, IconX } from '../icons';

const ClaimForm = () => {
  const { itemType = 'found', itemId } = useParams();
  const navigate = useNavigate();
  const normalizedItemType = itemType === 'lost' ? 'lost' : 'found';

  const [formData, setFormData] = useState({
    reason: '',
    brand: '',
    color: '',
    serial_number: '',
    unique_marks: '',
  });
  const [proofImage, setProofImage] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const res = await api.get(`/${normalizedItemType}-items/${itemId}`);
        setItemDetails(res.data.data);
      } catch {
        setError('Failed to load item details');
      } finally {
        setFetching(false);
      }
    };
    fetchItemDetails();
  }, [normalizedItemType, itemId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = new FormData();
    payload.append('item_id', itemId);
    payload.append('item_type', normalizedItemType);
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
    if (proofImage) payload.append('proof_image', proofImage);

    try {
      await api.post('/claims', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Claim submitted successfully! Redirecting...');
      setTimeout(() => navigate('/my-claims'), 1500);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;
  }

  if (!itemDetails) {
    return (
      <div className="max-w-lg mx-auto lux-card p-10 text-center">
        <span className="icon-tile text-white bg-gradient-to-br from-ink-700 to-ink-800 mx-auto mb-4">
          <IconX size={22} />
        </span>
        <h2 className="text-xl font-display font-semibold text-ink-900 mb-1">Item Not Found</h2>
        <p className="text-ink-400 mb-4">{error || "The item you're trying to claim doesn't exist."}</p>
        <Link to="/dashboard" className="lux-button inline-flex">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-scale-in">
      <div className="lux-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="icon-tile bg-gradient-to-br from-accent-500 to-accent-600 shadow-soft">
            <IconClaims size={20} className="text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink-900">Submit Claim</h1>
            <p className="text-sm text-ink-400">Claiming: {itemDetails.item_name}</p>
          </div>
        </div>

        <div className="mb-6 p-3 bg-cream-100 rounded-xl flex items-center gap-3">
          {itemDetails.image ? (
            <img
              src={buildAssetUrl(itemDetails.image)}
              alt={itemDetails.item_name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-white bg-gradient-to-br from-brand-500 to-accent-500">
              <IconFound size={20} />
            </span>
          )}
          <div>
            <p className="font-semibold text-ink-900">{itemDetails.item_name}</p>
            <p className="text-sm text-ink-400">
              {normalizedItemType === 'found'
                ? `Found at: ${itemDetails.location_found}`
                : `Lost at: ${itemDetails.location_lost}`}
            </p>
          </div>
        </div>

        {error && <div className="lux-alert-error">{error}</div>}
        {success && <div className="lux-alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="lux-label">Reason for Claim</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              className="lux-input"
              placeholder="Explain why this item belongs to you..."
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="lux-label">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="lux-input"
                placeholder="e.g., Apple, Samsung, Nike"
                disabled={loading}
              />
            </div>
            <div>
              <label className="lux-label">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="lux-input"
                placeholder="e.g., Silver, Black, Blue"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="lux-label">Serial Number</label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              className="lux-input"
              placeholder="Serial number (if available)"
              disabled={loading}
            />
            <p className="text-xs text-ink-400 mt-1">This is the best way to prove ownership.</p>
          </div>

          <div>
            <label className="lux-label">Unique Marks</label>
            <input
              type="text"
              name="unique_marks"
              value={formData.unique_marks}
              onChange={handleChange}
              className="lux-input"
              placeholder="e.g., Scratch on screen, Sticker on back"
              disabled={loading}
            />
          </div>

          <div>
            <label className="lux-label">Proof Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProofImage(e.target.files?.[0] || null)}
              disabled={loading}
              className="lux-input file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-ink-400 mt-1">JPEG, PNG, GIF up to 5MB</p>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="lux-button flex-1">
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="lux-button-secondary"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimForm;
