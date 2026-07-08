import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { IconLogoMark, IconMenu, IconClose } from '../icons';

// Nav links change based on auth/role — keeping them as data means the JSX below
// doesn't repeat itself for desktop vs mobile.
const GUEST_LINKS = [{ to: '/', label: 'Home', end: true }, { to: '/login', label: 'Login' }];
const USER_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/report-lost', label: 'Report Lost' },
  { to: '/report-found', label: 'Report Found' },
  { to: '/my-reports', label: 'My Reports', mobileOnly: true },
  { to: '/my-claims', label: 'My Claims' },
  { to: '/profile', label: 'Profile', mobileOnly: true },
];

const Logo = () => (
  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft transition-transform duration-300 group-hover:scale-105">
    <IconLogoMark size={18} />
  </span>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = user ? USER_LINKS : GUEST_LINKS;

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'}`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 text-base font-medium rounded-xl transition-colors duration-200 ${isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-600 hover:bg-ink-50'}`;

  return (
    <nav className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-xl border-b border-ink-100">
      <div className="w-full px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
            <Logo />
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              Lost<span className="text-brand-600">&amp;</span>Found
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.filter((l) => !l.mobileOnly).map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
            ))}
            {!user ? (
              <Link to="/register" className="lux-button ml-2 !py-2 !px-4 text-sm">Register</Link>
            ) : (
              <>
                {user.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
                <div className="w-px h-6 bg-ink-100 mx-2" />
                <NavLink to="/profile" className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-sm font-semibold shadow-soft transition-transform hover:scale-105">
                  {(user.full_name || 'U').trim().charAt(0).toUpperCase()}
                </NavLink>
                <button onClick={handleLogout} className="lux-button-ghost text-sm ml-1">Logout</button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-ink-600 hover:bg-ink-50 transition-colors" aria-label="Toggle menu">
            {open ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 animate-slide-down">
            <div className="flex flex-col gap-1 pt-2 border-t border-ink-100">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={mobileLinkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>
              ))}
              {!user ? (
                <NavLink to="/register" className={mobileLinkClass} onClick={() => setOpen(false)}>Register</NavLink>
              ) : (
                <>
                  {user.role === 'admin' && <NavLink to="/admin" className={mobileLinkClass} onClick={() => setOpen(false)}>Admin</NavLink>}
                  <button onClick={handleLogout} className="text-left px-4 py-3 text-base font-medium rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
