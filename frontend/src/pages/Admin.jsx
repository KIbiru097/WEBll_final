import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import {
  IconUsers, IconLost, IconFound, IconClaims,
  IconSearch, IconTrash, IconCheck, IconX, IconActivity, IconChartBar,
} from '../components/icons';

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const TABS = [
  { id: 'overview', label: 'View Stats', icon: IconChartBar },
  { id: 'users', label: 'Manage Users', icon: IconUsers },
  { id: 'reports', label: 'Manage Reports', icon: IconLost },
  { id: 'claims', label: 'Manage Claims', icon: IconClaims },
  { id: 'activity', label: 'Monitor Activity', icon: IconActivity },
];

const SEARCH_PLACEHOLDER = {
  overview: '',
  users: 'Search users by name or email…',
  reports: 'Search reports by item name…',
  claims: 'Search claims by name or item…',
  activity: 'Search activity by user or action…',
};

const Avatar = ({ name }) => (
  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-500 text-cream-50 text-xs font-semibold flex-shrink-0">
    {(name || 'U').trim().charAt(0).toUpperCase()}
  </span>
);

const EmptyRow = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-ink-400">
      {children}
    </td>
  </tr>
);

const ConfirmDeleteButton = ({ onConfirm, label = 'Delete', title }) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-ink-500">Sure?</span>
        <button
          onClick={() => { setConfirming(false); onConfirm(); }}
          className="text-xs font-semibold text-cream-50 bg-ink-900 px-2 py-1 rounded-lg hover:bg-ink-800 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold text-ink-500 hover:text-ink-800 transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      title={title || label}
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors"
    >
      <IconTrash size={14} /> {label}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);
  const [globalError, setGlobalError] = useState('');

  // Overview / stats
  const [dashboard, setDashboard] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState(null); // { userId, entries }

  // Reports (lost + found)
  const [reportType, setReportType] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Claims
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsFilter, setClaimsFilter] = useState('all');

  // Activity
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // ---- fetchers -----------------------------------------------------------

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [dashRes, statsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/statistics'),
      ]);
      setDashboard(dashRes.data.data);
      setStatistics(statsRes.data.data);
    } catch (err) {
      console.error('Overview error:', err);
      setGlobalError('Failed to load dashboard stats.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (searchTerm = '') => {
    setUsersLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { limit: 100, search: searchTerm || undefined } });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Users error:', err);
      setGlobalError('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async (searchTerm = '') => {
    setReportsLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        api.get('/admin/lost-items', { params: { limit: 100, search: searchTerm || undefined } }),
        api.get('/admin/found-items', { params: { limit: 100, search: searchTerm || undefined } }),
      ]);
      setLostItems(lostRes.data.data || []);
      setFoundItems(foundRes.data.data || []);
    } catch (err) {
      console.error('Reports error:', err);
      setGlobalError('Failed to load reports.');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const res = await api.get('/admin/claims', { params: { limit: 100 } });
      setClaims(res.data.data || []);
    } catch (err) {
      console.error('Claims error:', err);
      setGlobalError('Failed to load claims.');
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await api.get('/admin/logs', { params: { limit: 100 } });
      setActivity(res.data.data || []);
    } catch (err) {
      console.error('Activity error:', err);
      setGlobalError('Failed to load activity logs.');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Initial load: overview stats always, so the header numbers are ready immediately.
  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // Lazy-load each tab's data the first time it's opened.
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0 && !usersLoading) fetchUsers();
    if (activeTab === 'reports' && lostItems.length === 0 && foundItems.length === 0 && !reportsLoading) fetchReports();
    if (activeTab === 'claims' && claims.length === 0 && !claimsLoading) fetchClaims();
    if (activeTab === 'activity' && activity.length === 0 && !activityLoading) fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Search bar: debounce and re-query the backend for users/reports (server-side search);
  // claims/activity are filtered client-side further down since the API has no search param for them.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (activeTab !== 'users' && activeTab !== 'reports') return;
    debounceRef.current = setTimeout(() => {
      if (activeTab === 'users') fetchUsers(search);
      if (activeTab === 'reports') fetchReports(search);
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeTab]);

  // Reset the search box when switching tabs so filters don't leak between sections.
  const changeTab = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
  };

  // ---- actions --------------------------------------------------------------

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      fetchOverview();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const viewPasswordHistory = async (userId) => {
    setPasswordHistory({ userId, entries: null });
    try {
      const res = await api.get(`/admin/users/${userId}/password-history`);
      setPasswordHistory({ userId, entries: res.data.data || [] });
    } catch {
      setPasswordHistory({ userId, entries: [] });
    }
  };

  const handleDeleteItem = async (type, id) => {
    try {
      await api.delete(`/admin/${type}-items/${id}`);
      if (type === 'lost') setLostItems((prev) => prev.filter((i) => i.id !== id));
      else setFoundItems((prev) => prev.filter((i) => i.id !== id));
      fetchOverview();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  const handleClaimDecision = async (id, status) => {
    try {
      const res = await api.put(`/admin/claims/${id}`, { status });
      setClaims((prev) => prev.map((c) => (c.id === id ? res.data.data : c)));
      fetchOverview();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to update claim.');
    }
  };

  const handleDeleteClaim = async (id) => {
    try {
      await api.delete(`/admin/claims/${id}`);
      setClaims((prev) => prev.filter((c) => c.id !== id));
      fetchOverview();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to delete claim.');
    }
  };

  // ---- derived / filtered lists ----------------------------------------

  const filteredClaims = claims.filter((c) => {
    if (claimsFilter !== 'all' && c.status !== claimsFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.claimant_name?.toLowerCase().includes(q) ||
      c.item_name?.toLowerCase().includes(q) ||
      c.claimant_email?.toLowerCase().includes(q)
    );
  });

  const filteredActivity = activity.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  const currentReportItems = reportType === 'lost' ? lostItems : foundItems;

  // ---- render -------------------------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <p className="kicker text-accent-600 mb-1">Admin</p>
          <h1 className="text-3xl font-display font-bold text-ink-900">Admin Dashboard</h1>
        </div>

        {/* Top search bar */}
        <div className="relative w-full lg:w-96">
          <IconSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={activeTab === 'overview'}
            placeholder={SEARCH_PLACEHOLDER[activeTab]}
            className="lux-input pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {globalError && (
        <div className="lux-alert-error mb-6">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError('')} className="ml-auto text-ink-500 hover:text-ink-900">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-ink-100 pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 ${
                active ? 'bg-ink-900 text-cream-50' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- Overview / View Stats ---------------- */}
      {activeTab === 'overview' && (
        <OverviewTab loading={overviewLoading} dashboard={dashboard} statistics={statistics} />
      )}

      {/* ---------------- Manage Users ---------------- */}
      {activeTab === 'users' && (
        <UsersTab
          users={users}
          loading={usersLoading}
          onDelete={handleDeleteUser}
          onViewHistory={viewPasswordHistory}
        />
      )}

      {/* ---------------- Manage Reports ---------------- */}
      {activeTab === 'reports' && (
        <ReportsTab
          reportType={reportType}
          setReportType={setReportType}
          items={currentReportItems}
          loading={reportsLoading}
          onDelete={handleDeleteItem}
          lostCount={lostItems.length}
          foundCount={foundItems.length}
        />
      )}

      {/* ---------------- Manage Claims ---------------- */}
      {activeTab === 'claims' && (
        <ClaimsTab
          claims={filteredClaims}
          loading={claimsLoading}
          filter={claimsFilter}
          setFilter={setClaimsFilter}
          onApprove={(id) => handleClaimDecision(id, 'approved')}
          onReject={(id) => handleClaimDecision(id, 'rejected')}
          onDelete={handleDeleteClaim}
        />
      )}

      {/* ---------------- Monitor Activity ---------------- */}
      {activeTab === 'activity' && (
        <ActivityTab activity={filteredActivity} loading={activityLoading} />
      )}

      {/* Password History Modal */}
      {passwordHistory && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="lux-card max-w-md w-full max-h-96 overflow-auto animate-scale-in">
            <div className="p-6 border-b border-ink-100 flex justify-between items-center">
              <h3 className="text-xl font-display font-semibold text-ink-900">Password History</h3>
              <button
                onClick={() => setPasswordHistory(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {passwordHistory.entries === null ? (
                <div className="text-center py-4"><div className="spinner mx-auto"></div></div>
              ) : passwordHistory.entries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-ink-500 mb-4">
                    Last {passwordHistory.entries.length} password changes:
                  </p>
                  {passwordHistory.entries.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-ink-100 last:border-0">
                      <span className="text-sm text-ink-600">
                        Password #{passwordHistory.entries.length - index}
                      </span>
                      <span className="text-xs text-ink-400">{formatDate(entry.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-ink-400 py-4">No password history found for this user.</p>
              )}
              <button onClick={() => setPasswordHistory(null)} className="lux-button w-full mt-4">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Overview tab — "View Stats"
// ---------------------------------------------------------------------------

const OverviewTab = ({ loading, dashboard, statistics }) => {
  if (loading) return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;
  if (!dashboard) return <div className="lux-card p-10 text-center text-ink-400">No stats available.</div>;

  const statCards = [
    {
      label: 'Total Users', value: dashboard.users?.total_users || 0,
      detail: `${dashboard.users?.total_students || 0} Students · ${dashboard.users?.total_admins || 0} Admins`,
      icon: <IconUsers size={20} />, solid: true,
    },
    {
      label: 'Lost Items', value: dashboard.lost_items?.total_lost || 0,
      detail: `${dashboard.lost_items?.open_lost || 0} Open · ${dashboard.lost_items?.returned_lost || 0} Returned`,
      icon: <IconLost size={20} />,
    },
    {
      label: 'Found Items', value: dashboard.found_items?.total_found || 0,
      detail: `${dashboard.found_items?.available_found || 0} Available · ${dashboard.found_items?.returned_found || 0} Returned`,
      icon: <IconFound size={20} />,
    },
    {
      label: 'Claims', value: dashboard.claims?.total_claims || 0,
      detail: `${dashboard.claims?.pending_claims || 0} Pending · ${dashboard.claims?.approved_claims || 0} Approved`,
      icon: <IconClaims size={20} />, solid: true,
    },
  ];

  const successRate = statistics?.claim_success_rate?.success_rate;
  const avgResponse = statistics?.average_response_time;
  const topCategories = dashboard.top_categories || [];
  const maxCategory = Math.max(1, ...topCategories.map((c) => Number(c.count)));

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger">
        {statCards.map((card) => (
          <div key={card.label} className="lux-card p-6 hover:-translate-y-1">
            <span className={`icon-tile ${card.solid ? 'bg-ink-900 text-cream-50' : 'bg-accent-500 text-cream-50'} shadow-soft mb-3`}>
              {card.icon}
            </span>
            <div className="text-3xl font-display font-bold text-ink-900">{card.value}</div>
            <div className="text-ink-500 text-sm">{card.label}</div>
            <div className="text-xs text-ink-400 mt-1">{card.detail}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lux-card p-6 lg:col-span-1">
          <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">Claim Performance</h2>
          <div className="mb-4">
            <div className="text-3xl font-display font-bold text-ink-900">{successRate != null ? `${successRate}%` : '—'}</div>
            <div className="text-sm text-ink-500">Claims approved</div>
          </div>
          <div>
            <div className="text-3xl font-display font-bold text-ink-900">{avgResponse != null ? `${avgResponse}h` : '—'}</div>
            <div className="text-sm text-ink-500">Average review time</div>
          </div>
        </div>

        <div className="lux-card p-6 lg:col-span-2">
          <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">Top Categories</h2>
          {topCategories.length === 0 ? (
            <p className="text-ink-400 text-sm">No category data yet.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-700 font-medium">{cat.category || 'Uncategorized'}</span>
                    <span className="text-ink-400">{cat.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full"
                      style={{ width: `${(Number(cat.count) / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lux-card p-6">
        <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">Most Recent Activity</h2>
        {(dashboard.recent_activity || []).length === 0 ? (
          <p className="text-ink-400 text-sm">Nothing logged yet.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {dashboard.recent_activity.slice(0, 6).map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={log.user_name} />
                  <div>
                    <p className="text-sm font-medium text-ink-900">{log.user_name || 'System'}</p>
                    <p className="text-xs text-ink-400">{log.details}</p>
                  </div>
                </div>
                <span className="text-xs text-ink-400 whitespace-nowrap">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Users tab — "Manage Users"
// ---------------------------------------------------------------------------

const UsersTab = ({ users, loading, onDelete, onViewHistory }) => {
  if (loading) return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="lux-card overflow-hidden">
      <div className="p-6 border-b border-ink-100 flex justify-between items-center">
        <h2 className="text-xl font-display font-semibold text-ink-900">Users</h2>
        <span className="status-badge status-open">{users.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-ink-50">
            <tr>
              {['User', 'Email', 'Role', 'Registered', 'History', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-ink-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.full_name} />
                    <div className="font-medium text-ink-900">{user.full_name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-500">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`status-badge ${user.role === 'admin' ? 'status-approved' : 'status-open'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-ink-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onViewHistory(user.id)} className="text-xs font-semibold text-accent-600 hover:text-accent-800 transition-colors">
                    View
                  </button>
                </td>
                <td className="px-4 py-3">
                  <ConfirmDeleteButton onConfirm={() => onDelete(user.id)} title="Delete this account" />
                </td>
              </tr>
            ))}
            {users.length === 0 && <EmptyRow colSpan={6}>No users found.</EmptyRow>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reports tab — "Manage Reports" (lost + found)
// ---------------------------------------------------------------------------

const ReportsTab = ({ reportType, setReportType, items, loading, onDelete, lostCount, foundCount }) => (
  <div>
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setReportType('lost')}
        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${reportType === 'lost' ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-ink-50'}`}
      >
        Lost Items ({lostCount})
      </button>
      <button
        onClick={() => setReportType('found')}
        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${reportType === 'found' ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-ink-50'}`}
      >
        Found Items ({foundCount})
      </button>
    </div>

    {loading ? (
      <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>
    ) : (
      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr>
                {['Item', 'Category', 'Reported By', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-ink-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{item.item_name}</div>
                    <div className="text-xs text-ink-400 max-w-xs truncate">{item.description}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{item.category}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-700">{item.reported_by}</div>
                    <div className="text-xs text-ink-400">{item.reporter_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-500">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3">
                    <ConfirmDeleteButton onConfirm={() => onDelete(reportType, item.id)} title="Remove this report" />
                  </td>
                </tr>
              ))}
              {items.length === 0 && <EmptyRow colSpan={6}>No {reportType} items found.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Claims tab — "Manage Claims"
// ---------------------------------------------------------------------------

const CLAIM_FILTERS = ['all', 'pending', 'approved', 'rejected'];

const ClaimsTab = ({ claims, loading, filter, setFilter, onApprove, onReject, onDelete }) => (
  <div>
    <div className="flex gap-2 mb-4">
      {CLAIM_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-4 py-2 text-sm font-semibold rounded-xl capitalize transition-colors ${filter === f ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-ink-50'}`}
        >
          {f}
        </button>
      ))}
    </div>

    {loading ? (
      <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>
    ) : (
      <div className="lux-card overflow-hidden">
        <div className="divide-y divide-ink-100">
          {claims.map((claim) => (
            <div key={claim.id} className="p-5 flex flex-wrap justify-between items-start gap-4 hover:bg-ink-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <Avatar name={claim.claimant_name} />
                <div>
                  <h3 className="font-semibold text-ink-900">{claim.item_name || `Item #${claim.item_id}`}</h3>
                  <p className="text-sm text-ink-500 capitalize">{claim.item_type} item · claimed by {claim.claimant_name}</p>
                  <p className="text-sm text-ink-400 mt-1 max-w-md">{claim.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`status-badge status-${claim.status}`}>{claim.status}</span>
                {claim.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onApprove(claim.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cream-50 bg-accent-500 hover:bg-accent-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <IconCheck size={13} /> Approve
                    </button>
                    <button
                      onClick={() => onReject(claim.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700 bg-ink-100 hover:bg-ink-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <IconX size={13} /> Reject
                    </button>
                  </>
                )}
                <ConfirmDeleteButton onConfirm={() => onDelete(claim.id)} label="" title="Delete claim" />
              </div>
            </div>
          ))}
          {claims.length === 0 && (
            <div className="px-4 py-10 text-center text-ink-400">No claims match this filter.</div>
          )}
        </div>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Activity tab — "Monitor Activity"
// ---------------------------------------------------------------------------

const ActivityTab = ({ activity, loading }) => {
  if (loading) return <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="lux-card overflow-hidden">
      <div className="p-6 border-b border-ink-100">
        <h2 className="text-xl font-display font-semibold text-ink-900">Activity Log</h2>
        <p className="text-sm text-ink-400 mt-1">What users have been doing across the system.</p>
      </div>
      <div className="divide-y divide-ink-100">
        {activity.map((log) => (
          <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-ink-50/60 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar name={log.user_name} />
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {log.user_name || 'System'} <span className="text-ink-400 font-normal">· {log.action}</span>
                </p>
                <p className="text-xs text-ink-400">{log.details}</p>
              </div>
            </div>
            <span className="text-xs text-ink-400 whitespace-nowrap">{formatDate(log.created_at)}</span>
          </div>
        ))}
        {activity.length === 0 && (
          <div className="px-4 py-10 text-center text-ink-400">No activity recorded yet.</div>
        )}
      </div>
    </div>
  );
};

export default Admin;
