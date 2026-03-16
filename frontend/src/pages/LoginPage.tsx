import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { Home, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('sarah@realtorhub.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel — Navy Hero (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-500 relative overflow-hidden flex-col justify-between p-12">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&h=1200&fit=crop&q=80)',
          }}
          aria-hidden="true"
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-600/50 to-navy-800/80" aria-hidden="true" />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-navy-500" />
            </div>
            <span className="font-display font-bold text-2xl">
              <span className="text-gold-400">NuVista</span>
              <span className="text-white"> Realty</span>
            </span>
          </Link>

          {/* Tagline */}
          <h2 className="font-display font-bold text-4xl xl:text-5xl text-white leading-tight mb-4">
            Ontario's Premier<br />
            <span className="text-gold-400">Real Estate</span><br />
            Brokerage
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Access your CRM dashboard to manage listings, leads, and grow your business.
          </p>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '1,200+', label: 'Homes Sold' },
            { value: '284', label: 'Active Listings' },
            { value: '15+', label: 'Years Experience' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold text-gold-400">{stat.value}</p>
              <p className="text-xs text-white/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-gold-400" />
            </div>
            <span className="font-display font-bold text-2xl">
              <span className="text-navy-500">NuVista</span>
              <span className="text-gray-400"> Realty</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-navy-500 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to your NuVista CRM account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-public"
                placeholder="you@nuvistarealty.ca"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-navy-500 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-public pr-11"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-navy w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Sign in"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium uppercase tracking-wide">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {[
                { role: 'Admin', email: 'sarah@realtorhub.com' },
                { role: 'Agent', email: 'michael@realtorhub.com' },
                { role: 'Broker', email: 'priya@realtorhub.com' },
              ].map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword('Password123!');
                    clearError();
                  }}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-navy-50 hover:border-navy-200 border border-gray-100 transition-all"
                >
                  <span className="text-xs font-semibold text-navy-500">{demo.role}</span>
                  <span className="text-xs text-gray-400 font-mono">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Back to Site */}
          <p className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-navy-500 transition-colors"
            >
              ← Back to NuVista Realty
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
