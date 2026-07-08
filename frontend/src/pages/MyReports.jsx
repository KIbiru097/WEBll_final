import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ItemCard from '../components/Items/ItemCard';
import { useAuth } from '../contexts/useAuth';
import api from '../services/api';

const MyReports = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get('type') || 'lost';
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [lostRes, foundRes] = await Promise.all([
          api.get('/lost-items', { params: { user_id: user.id, limit: 50 } }),
          api.get('/found-items', { params: { user_id: user.id, limit: 50 } })
        ]);
        setLostItems(lostRes.data.data || []);
        setFoundItems(foundRes.data.data || []);
      } catch (error) {
        console.error('Reports error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user.id]);

  const visibleItems = useMemo(() => (
    selectedType === 'found' ? foundItems : lostItems
  ), [selectedType, lostItems, foundItems]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-display font-bold text-ink-900">My Reports</h1>
        <div className="flex rounded-xl border border-white/10 bg-white/5 backdrop-blur p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setSearchParams({ type: 'lost' })}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${selectedType === 'lost' ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-soft' : 'text-ink-500 hover:bg-ink-50'}`}
          >
            Lost
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ type: 'found' })}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${selectedType === 'found' ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-soft' : 'text-ink-500 hover:bg-ink-50'}`}
          >
            Found
          </button>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="lux-card p-10 text-center text-ink-400">No {selectedType} reports yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {visibleItems.map((item) => (
            <ItemCard key={`${selectedType}-${item.id}`} item={item} type={selectedType} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReports;
