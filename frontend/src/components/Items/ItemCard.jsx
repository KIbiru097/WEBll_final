import React from 'react';
import { Link } from 'react-router-dom';
import { buildAssetUrl } from '../../services/api';

const ItemCard = ({ item, type }) => {
  const statusColors = {
    open: 'status-open',
    available: 'status-available',
    claimed: 'status-claimed',
    returned: 'status-returned'
  };

  const statusLabels = {
    open: 'Open',
    available: 'Available',
    claimed: 'Claimed',
    returned: 'Returned'
  };

  return (
    <div className="lux-card overflow-hidden group hover:-translate-y-1">
      {item.image ? (
        <div className="overflow-hidden h-44">
          <img
            src={buildAssetUrl(item.image)}
            alt={item.item_name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-3 bg-gradient-to-r from-brand-500 to-accent-500" />
      )}
      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="text-lg font-display font-semibold text-ink-900">{item.item_name}</h3>
          <span className={`status-badge ${statusColors[item.status] || ''}`}>
            {statusLabels[item.status] || item.status}
          </span>
        </div>

        <p className="text-sm text-ink-500 mb-2">
          <span className="font-medium text-ink-700">Category:</span> {item.category}
        </p>

        <p className="text-sm text-ink-500 mb-3 line-clamp-2">
          {item.description || 'No description provided'}
        </p>

        <div className="text-sm text-ink-400 mb-4 space-y-0.5">
          <p>
            <span className="font-medium text-ink-600">
              {type === 'lost' ? 'Lost at:' : 'Found at:'}
            </span> {type === 'lost' ? item.location_lost : item.location_found}
          </p>
          <p>
            <span className="font-medium text-ink-600">Date:</span>{' '}
            {type === 'lost'
              ? new Date(item.date_lost).toLocaleDateString()
              : new Date(item.date_found).toLocaleDateString()
            }
          </p>
        </div>

        <div className="flex justify-between items-center gap-4 pt-3 border-t border-ink-100">
          <span className="text-xs text-ink-400">
            Reported by: {item.reporter_name || 'Anonymous'}
          </span>
          <Link
            to={`/${type === 'lost' ? 'lost' : 'found'}-items/${item.id}`}
            className="lux-link text-sm whitespace-nowrap"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
