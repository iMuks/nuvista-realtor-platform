import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Buy',          href: '/properties' },
  { label: 'Sell',         href: '/agents' },
  { label: 'Find Agent',   href: '/agents' },
  { label: 'About',        href: '/#about' },
  { label: 'Contact',      href: '/#contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  /* On home page: starts transparent, turns solid after scroll.
     On other pages: always solid. */
  const solid = !isHome || scrolled;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          solid
            ? 'bg-navy-500 shadow-lg shadow-black/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-[72px]">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="NuVista Realty home">
              {/* Icon mark */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center
                                group-hover:bg-gold-400 transition-colors duration-300">
                  {/* Custom house lettermark */}
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                    <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                      fill="none" stroke="#0f2b52" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M7 18v-6h6v6" stroke="#0f2b52" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {/* Wordmark */}
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-[1.25rem] leading-none tracking-[-0.01em]">
                  <span className="text-gold-400">Nu</span><span className="text-white">Vista</span>
                </span>
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-[0.18em] mt-0.5">Realty</span>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  className="relative px-4 py-2 text-[13.5px] font-medium text-white/75 hover:text-white
                             transition-colors duration-200 rounded-lg hover:bg-white/8 group"
                >
                  {link.label}
                  <span className="absolute bottom-1.5 left-4 right-4 h-px bg-gold-400
                                   scale-x-0 group-hover:scale-x-100 origin-left
                                   transition-transform duration-300 ease-out" />
                </NavLink>
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="hidden lg:flex items-center gap-5">
              <a
                href="tel:5194385478"
                className="flex items-center gap-2 text-[13px] font-semibold text-gold-400
                           hover:text-gold-300 transition-colors duration-200"
                aria-label="Call NuVista"
              >
                <Phone className="w-3.5 h-3.5" />
                (519) 438-5478
              </a>

              <Link
                to="/login"
                className="text-[13px] font-semibold text-navy-500 bg-gold-400
                           hover:bg-gold-300 px-4 py-2 rounded-lg
                           transition-all duration-200 shadow-sm"
              >
                Agent Login
              </Link>
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center
                         rounded-lg text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
            mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-navy-700/95 backdrop-blur-xl border-t border-white/8 px-5 py-4 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-[14px] font-medium
                           text-white/75 hover:text-white hover:bg-white/8 transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
              <a
                href="tel:5194385478"
                className="flex items-center gap-2 px-4 py-3 text-gold-400
                           text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors"
              >
                <Phone className="w-4 h-4" />
                (519) 438-5478
              </a>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mx-0 text-center font-semibold text-navy-500 bg-gold-400
                           hover:bg-gold-300 px-4 py-3 rounded-xl text-sm transition-all"
              >
                Agent Login
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
