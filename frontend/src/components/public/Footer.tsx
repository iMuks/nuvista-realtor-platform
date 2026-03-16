import { Link } from 'react-router-dom';
import { Home, Phone, Mail, MapPin, Facebook, Linkedin } from 'lucide-react';

const quickLinks = [
  { label: 'Buy a Home', href: '/properties' },
  { label: 'Sell Your Home', href: '/agents' },
  { label: 'Find an Agent', href: '/agents' },
  { label: 'New Listings', href: '/properties?status=active' },
  { label: 'Open Houses', href: '/properties?status=active' },
  { label: 'Market Reports', href: '/#market' },
];

const services = [
  { label: 'Residential Sales', href: '/' },
  { label: 'Luxury Properties', href: '/properties?priceMin=1500000' },
  { label: 'Condominiums', href: '/properties?propertyType=condo' },
  { label: 'Investment Properties', href: '/properties' },
  { label: 'Relocation Services', href: '/agents' },
  { label: 'Commercial Real Estate', href: '/agents' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-500 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-navy-500" />
              </div>
              <span className="font-display font-bold text-xl">
                <span className="text-gold-400">NuVista</span>
                <span className="text-white"> Realty</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Ontario's Premier Real Estate Brokerage. Serving the GTA and Southern Ontario with integrity, expertise, and a passion for finding your perfect home.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-gold-500 flex items-center justify-center transition-colors"
                aria-label="Follow NuVista Realty on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-gold-500 flex items-center justify-center transition-colors"
                aria-label="Follow NuVista Realty on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-5 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-gold-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-display font-semibold text-white mb-5 text-sm uppercase tracking-wider">
              Services
            </h3>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service.label}>
                  <Link
                    to={service.href}
                    className="text-white/60 hover:text-gold-400 text-sm transition-colors"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-white mb-5 text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">
                  805 Adelaide St N<br />
                  London, Ontario N5Y 2L5
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a
                  href="tel:5194385478"
                  className="text-white/60 hover:text-gold-400 text-sm transition-colors"
                >
                  (519) 438-5478
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a
                  href="mailto:nuvistarealty@rogers.com"
                  className="text-white/60 hover:text-gold-400 text-sm transition-colors break-all"
                >
                  nuvistarealty@rogers.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/40 text-xs text-center sm:text-left">
              &copy; {currentYear} NuVista Realty. All rights reserved. Licensed under RECO. The trademarks
              REALTOR<sup>&reg;</sup>, REALTORS<sup>&reg;</sup>, and the REALTOR<sup>&reg;</sup> logo are
              controlled by CREA<sup>&reg;</sup> and identify real estate professionals who are members of
              CREA. The trademarks MLS<sup>&reg;</sup>, Multiple Listing Service<sup>&reg;</sup> and the
              associated logos are owned by CREA and identify the quality of services provided by real estate
              professionals who are members of CREA.
            </p>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link to="/privacy" className="text-white/40 hover:text-gold-400 text-xs transition-colors">
                Privacy Policy
              </Link>
              <span className="text-white/20 text-xs">|</span>
              <Link to="/terms" className="text-white/40 hover:text-gold-400 text-xs transition-colors">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
