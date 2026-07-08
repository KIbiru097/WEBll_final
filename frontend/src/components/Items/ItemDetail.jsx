import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api, { buildAssetUrl } from '../../services/api';
import { useAuth } from '../../contexts/useAuth';
import { IconLost, IconFound, IconClaims, IconX } from '../icons';

const ItemDetail = ({ type: typeProp }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const type = typeProp || (location.pathname.startsWith('/lost-items') ? 'lost' : 'found');

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/${type}-items/${id}`);
        setItem(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Item not found');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [type, id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;
  }

  if (error || !item) {
    return (
      <div className="max-w-lg mx-auto lux-card p-10 text-center">
        <span className="icon-tile text-white bg-gradient-to-br from-ink-700 to-ink-800 mx-auto mb-4">
          <IconX size={22} />
        </span>
        <h2 className="text-xl font-display font-semibold text-ink-900 mb-1">Item Not Found</h2>
        <p className="text-ink-400 mb-4">{error || "The item you're looking for doesn't exist."}</p>
        <Link to="/dashboard" className="lux-button inline-flex">Back to Dashboard</Link>
      </div>
    );
  }

  const isOwnItem = user?.id === item.user_id;
  const isFound = type === 'found';
  const canClaim = (isFound ? item.status === 'available' : item.status === 'open') && !isOwnItem;

  const claimLabel = () => {
    if (isOwnItem) return 'You Reported This Item';
    if (item.status === 'returned') return 'Already Returned';
    if (canClaim) return 'Submit Claim';
    return 'Not Available';
  };

  const dateValue = isFound ? item.date_found : item.date_lost;

  const fields = [
    { label: 'Category', value: item.category },
    { label: isFound ? 'Location Found' : 'Location Lost', value: isFound ? item.location_found : item.location_lost },
    { label: isFound ? 'Date Found' : 'Date Lost', value: dateValue ? new Date(dateValue).toLocaleDateString() : '—' },
    { label: 'Reported By', value: item.reporter_name || 'Anonymous' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="lux-card overflow-hidden">
        {item.image ? (
          <img
            src={buildAssetUrl(item.image)}
            alt={item.item_name}
            className="w-full h-72 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center text-white bg-gradient-to-br from-brand-500 to-accent-500">
            {isFound ? <IconFound size={36} /> : <IconLost size={36} />}
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-display font-bold text-ink-900">{item.item_name}</h1>
            <span className={`status-badge status-${item.status}`}>{item.status}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-1">{f.label}</p>
                <p className="font-medium text-ink-900">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-1">Description</p>
            <p className="text-ink-700">{item.description || 'No description provided.'}</p>
          </div>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-ink-100">
            <button
              onClick={() => navigate(`/claim/${type}/${item.id}`)}
              disabled={!canClaim}
              className="lux-button flex-1 min-w-[180px]"
            >
              <IconClaims size={16} /> {claimLabel()}
            </button>
            <button onClick={() => navigate(-1)} className="lux-button-secondary flex-1 min-w-[120px]">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
