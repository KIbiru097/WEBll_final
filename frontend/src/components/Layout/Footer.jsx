import React from 'react';
import { Link } from 'react-router-dom';
import { IconLogoMark } from '../icons';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-ink-100 bg-cream-50/80 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white">
              <IconLogoMark size={14} />
            </span>
            <span className="font-display font-semibold text-ink-800 text-sm">Lost &amp; Found</span>
          </div>
          <p className="text-sm text-ink-400 text-center">
            © 2026 Lost &amp; Found Management System · Built for the university community
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-ink-500 hover:text-brand-600 transition-colors">Home</Link>
            <Link to="/login" className="text-ink-500 hover:text-brand-600 transition-colors">Login</Link>
            <Link to="/register" className="text-ink-500 hover:text-brand-600 transition-colors">Register</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
