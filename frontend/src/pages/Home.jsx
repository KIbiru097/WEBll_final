import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ItemCard from '../components/Items/ItemCard';
import { IconLost, IconSearch, IconClaims, IconCheck } from '../components/icons';

// Static content for the "How It Works" and "Categories" sections — informational,
// doesn't depend on the API.
const STEPS = [
  { icon: <IconLost size={22} />, title: 'Report', text: 'Lost or found an item? Submit a report with details and photos.' },
  { icon: <IconSearch size={22} />, title: 'Search', text: 'Browse lost & found items, filtered by category, location, and date.' },
  { icon: <IconClaims size={22} />, title: 'Claim', text: 'Submit an ownership claim with supporting evidence for admin review.' },
];

const CATEGORIES = ['Electronics', 'ID Cards & Documents', 'Bags & Accessories', 'Books & Stationery', 'Personal Items'];

const WHY_US = [
  'Verified ownership claims, reviewed by admins',
  'Real-time status tracking from pending to approved',
  'Photo uploads to help identify items faster',
  'Campus-wide coverage across every building',
];

const Home = () => {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (params = {}) => {
    setLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        api.get('/lost-items', { params }),
        api.get('/found-items', { params })
      ]);
      setLostItems(lostRes.data.data || []);
      setFoundItems(foundRes.data.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (category) params.category = category;
    fetchItems(params);
  };

  const filterByCategory = (cat) => {
    setCategory(cat);
    setSearchTerm('');
    fetchItems({ category: cat });
  };

  // Live trust-bar numbers, derived from what's actually in the system.
  const stats = useMemo(() => {
    const all = [...lostItems, ...foundItems];
    const recovered = all.filter((i) => i.status === 'returned').length;
    return {
      totalReports: all.length,
      recovered,
      activeLost: lostItems.filter((i) => i.status === 'open').length,
      availableFound: foundItems.filter((i) => i.status === 'available').length,
    };
  }, [lostItems, foundItems]);

  if (loading && lostItems.length === 0 && foundItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="lux-panel p-8 md:p-14">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl animate-blob" />
        <div className="absolute -bottom-28 -left-10 w-80 h-80 rounded-full bg-accent-400/15 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="relative">
          <p className="kicker text-brand-400 mb-4">Campus Lost &amp; Found</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 max-w-2xl leading-tight">
            Lost Something? We'll Help You Find It.
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl">
            A secure, verified system connecting students with their lost items &mdash; report, search, and recover across campus.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/report-lost" className="lux-button">Report Lost Item</Link>
            <Link to="/report-found" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-white/20 text-white transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5">
              Report Found Item
            </Link>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10">
          {[
            { label: 'Reports Filed', value: stats.totalReports },
            { label: 'Items Recovered', value: stats.recovered },
            { label: 'Open Lost Reports', value: stats.activeLost },
            { label: 'Available to Claim', value: stats.availableFound },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-display font-bold text-brand-400">{stat.value}</div>
              <div className="text-xs md:text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div>
        <h2 className="text-2xl font-display font-semibold text-ink-900 mb-5 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger">
          {STEPS.map((step, i) => (
            <div key={step.title} className="lux-card p-6 text-center">
              <span className="icon-tile bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-soft mx-auto mb-4">
                {step.icon}
              </span>
              <div className="text-xs font-semibold text-brand-500 mb-1">STEP {i + 1}</div>
              <h3 className="font-display font-semibold text-ink-900 mb-1.5">{step.title}</h3>
              <p className="text-sm text-ink-500">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="lux-card p-6 md:p-7">
        <h2 className="text-xl font-display font-semibold mb-4 text-ink-900">Search Items</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name or description..."
            className="lux-input flex-1 min-w-[220px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="lux-input sm:w-56"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            <option value="ID Cards">ID Cards</option>
            <option value="Bags">Bags</option>
            <option value="Clothing">Clothing</option>
            <option value="Personal Items">Personal Items</option>
          </select>
          <button onClick={handleSearch} className="lux-button">Search</button>
        </div>

        {/* Featured Categories — quick filters */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => filterByCategory(cat)}
              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-white/10 text-ink-500 hover:text-brand-500 hover:border-brand-500/40 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lost Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-semibold text-ink-900">Recently Lost</h2>
          <span className="status-badge status-open">{lostItems.length} items</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {lostItems.map((item) => (
            <ItemCard key={item.id} item={item} type="lost" />
          ))}
          {lostItems.length === 0 && (
            <p className="text-ink-400 col-span-3 lux-card p-6 text-center">No lost items reported yet.</p>
          )}
        </div>
      </div>

      {/* Found Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-semibold text-ink-900">Recently Found</h2>
          <span className="status-badge status-available">{foundItems.length} items</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {foundItems.map((item) => (
            <ItemCard key={item.id} item={item} type="found" />
          ))}
          {foundItems.length === 0 && (
            <p className="text-ink-400 col-span-3 lux-card p-6 text-center">No found items reported yet.</p>
          )}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="lux-card p-6 md:p-8">
        <h2 className="text-2xl font-display font-semibold text-ink-900 mb-5">Why Choose This System</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_US.map((text) => (
            <div key={text} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-500/15 text-accent-400 flex-shrink-0 mt-0.5">
                <IconCheck size={14} />
              </span>
              <p className="text-sm text-ink-500">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="lux-panel p-8 md:p-10 text-center">
        <div className="absolute -top-16 left-1/3 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Found an item? Lost something?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Join the students using the campus Lost &amp; Found system to recover what matters.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/report-lost" className="lux-button">Report Lost</Link>
            <Link to="/report-found" className="lux-button-secondary">Report Found</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
