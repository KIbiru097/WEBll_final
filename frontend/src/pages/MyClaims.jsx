import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { buildAssetUrl } from '../services/api';
import { IconClaims } from '../components/icons';

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get('/claims');
        setClaims(res.data.data || []);
      } catch {
        setError('Failed to load claims');
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? claims.length : claims.filter((c) => c.status === f).length;
    return acc;
  }, {});

  const visibleClaims = filter === 'all' ? claims : claims.filter((c) => c.status === filter);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <p className="kicker text-brand-600 mb-1">Claims</p>
          <h1 className="text-3xl font-display font-bold text-ink-900">My Claims</h1>
          <p className="text-ink-500 text-sm mt-1">Track the ownership claims you've submitted</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl capitalize transition-colors ${
                filter === f ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-ink-50'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {error && <div className="lux-alert-error">{error}</div>}

      {visibleClaims.length === 0 ? (
        <div className="lux-card p-10 text-center">
          <span className="icon-tile text-white bg-gradient-to-br from-accent-500 to-accent-700 shadow-soft mx-auto mb-4">
            <IconClaims size={22} />
          </span>
          <h3 className="text-lg font-display font-semibold text-ink-900 mb-1">
            No {filter !== 'all' ? filter : ''} claims yet
          </h3>
          <p className="text-ink-400 mb-4">
            Found a lost item? Open it from Found Items and click "Claim This Item".
          </p>
          <Link to="/" className="lux-button inline-flex">Browse Found Items</Link>
        </div>
      ) : (
        <div className="lux-card overflow-hidden">
          <div className="divide-y divide-ink-100 stagger">
            {visibleClaims.map((claim) => (
              <div key={claim.id} className="p-5 flex flex-wrap gap-4">
                {claim.item_image ? (
                  <img
                    src={buildAssetUrl(claim.item_image)}
                    alt={claim.item_name || 'Claimed item'}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-ink-100"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-white bg-gradient-to-br from-ink-700 to-ink-800">
                    <IconClaims size={22} />
                  </span>
                )}

                <div className="flex-1 min-w-[220px]">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-ink-900">
                      {claim.item_name || `Item #${claim.item_id}`}
                    </h3>
                    <span className={`status-badge status-${claim.status}`}>{claim.status}</span>
                  </div>
                  <p className="text-sm text-ink-500 capitalize">
                    {claim.item_type} item · submitted {new Date(claim.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-ink-400 mt-1">{claim.reason}</p>

                  {(claim.brand || claim.color || claim.serial_number || claim.unique_marks) && (
                    <p className="text-xs text-ink-400 mt-1">
                      {[
                        claim.brand && `Brand: ${claim.brand}`,
                        claim.color && `Color: ${claim.color}`,
                        claim.serial_number && `Serial: ${claim.serial_number}`,
                        claim.unique_marks && `Marks: ${claim.unique_marks}`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  {claim.proof_image && (
                    <a
                      href={buildAssetUrl(claim.proof_image)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-3 group"
                    >
                      <img
                        src={buildAssetUrl(claim.proof_image)}
                        alt="Your proof"
                        className="w-12 h-12 rounded-lg object-cover border border-ink-200"
                      />
                      <span className="lux-link text-xs">View your proof photo →</span>
                    </a>
                  )}

                  {claim.admin_notes && (
                    <div className="mt-3 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                      <p className="text-sm text-accent-700">
                        <strong>Admin note:</strong> {claim.admin_notes}
                      </p>
                    </div>
                  )}
                </div>

                {claim.status === 'rejected' && (
                  <Link
                    to={`/claim/${claim.item_type}/${claim.item_id}`}
                    className="lux-button-secondary self-start text-sm"
                  >
                    Resubmit
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClaims;
