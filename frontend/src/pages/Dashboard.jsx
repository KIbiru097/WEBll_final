import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import api from '../services/api';
import { IconLost, IconFound, IconClaims } from '../components/icons';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    lostCount: 0,
    foundCount: 0,
    claimsCount: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [lostRes, foundRes, claimsRes] = await Promise.all([
        api.get('/lost-items', { params: { user_id: user.id, limit: 5 } }),
        api.get('/found-items', { params: { user_id: user.id, limit: 5 } }),
        api.get('/auth/stats')
      ]);

      setStats({
        lostCount: claimsRes.data.data?.total_lost_reports || 0,
        foundCount: claimsRes.data.data?.total_found_reports || 0,
        claimsCount: claimsRes.data.data?.total_claims || 0
      });

      setRecentItems([...lostRes.data.data || [], ...foundRes.data.data || []]);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Items Lost',
      value: stats.lostCount,
      link: '/my-reports?type=lost',
      icon: <IconLost size={22} />,
      tint: 'from-accent-500 to-accent-700',
    },
    {
      label: 'Items Found',
      value: stats.foundCount,
      link: '/my-reports?type=found',
      icon: <IconFound size={22} />,
      tint: 'from-ink-700 to-ink-800',
    },
    {
      label: 'Claims Submitted',
      value: stats.claimsCount,
      link: '/my-claims',
      icon: <IconClaims size={22} />,
      tint: 'from-accent-400 to-accent-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="kicker text-brand-600 mb-1">Dashboard</p>
          <h1 className="text-3xl font-display font-bold text-ink-900">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        </div>
        <Link to="/profile" className="lux-button-secondary self-start sm:self-auto">Edit Profile</Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className="lux-card p-6 flex items-start gap-4 hover:-translate-y-1">
            <span className={`icon-tile text-white bg-gradient-to-br ${card.tint} shadow-soft`}>
              {card.icon}
            </span>
            <div>
              <div className="text-3xl font-display font-bold text-ink-900">{card.value}</div>
              <div className="text-ink-500 text-sm mb-1">{card.label}</div>
              <span className="text-brand-600 text-xs font-semibold">View all →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="lux-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-ink-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/report-lost" className="lux-button">
            Report Lost Item
          </Link>
          <Link to="/report-found" className="lux-button">
            Report Found Item
          </Link>
          <Link to="/profile" className="lux-button-secondary">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lux-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-ink-900">Recent Activity</h2>
        {recentItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ink-400 mb-1">Nothing here yet</p>
            <p className="text-sm text-ink-300">Reports you file will show up in this list.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {recentItems.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-ink-900">{item.item_name}</p>
                  <p className="text-sm text-ink-500">
                    {item.location_lost ? `Lost at: ${item.location_lost}` : `Found at: ${item.location_found}`}
                  </p>
                </div>
                <span className={`status-badge status-${item.status}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
