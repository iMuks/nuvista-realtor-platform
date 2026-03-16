import { useState } from 'react';
import { Mail, Phone, CheckCircle2, Send } from 'lucide-react';
import AgentCard from '../../components/public/AgentCard';
import type { User } from '../../types';

// Mock agents — London, Ontario area
const AGENTS: User[] = [
  {
    _id: 'a1',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah@nuvistarealty.ca',
    phone: '(519) 438-5478',
    role: 'broker',
    brokerage: 'NuVista Realty',
    licenseNumber: 'M22001234',
    bio: 'With 12+ years of experience in the London and Southern Ontario market, Sarah specializes in luxury and executive properties. As Broker of Record, she leads the NuVista team with a commitment to excellence and client-first service.',
    fullName: 'Sarah Mitchell',
    isActive: true,
    createdAt: new Date(Date.now() - 4 * 365 * 86400000).toISOString(),
  },
  {
    _id: 'a2',
    firstName: 'James',
    lastName: 'Kowalski',
    email: 'james@nuvistarealty.ca',
    phone: '(519) 438-5479',
    role: 'agent',
    brokerage: 'NuVista Realty',
    licenseNumber: 'M24005678',
    bio: 'First-time buyers specialist with a passion for helping families find the right home at the right price. James brings a data-driven approach and deep market knowledge to every transaction, ensuring clients make confident decisions.',
    fullName: 'James Kowalski',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 365 * 86400000).toISOString(),
  },
  {
    _id: 'a3',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya@nuvistarealty.ca',
    phone: '(519) 438-5480',
    role: 'agent',
    brokerage: 'NuVista Realty',
    licenseNumber: 'M23009012',
    bio: 'Investment property expert and relocation specialist. Priya has helped hundreds of clients maximize returns across Southern Ontario. Her bilingual capabilities (English & Malayalam) allow her to serve a diverse clientele.',
    fullName: 'Priya Nair',
    isActive: true,
    createdAt: new Date(Date.now() - 1.5 * 365 * 86400000).toISOString(),
  },
];

const AGENT_LISTINGS: Record<string, number> = {
  a1: 4,
  a2: 3,
  a3: 2,
};

const AGENT_STATS: Record<string, { sold: number; years: string; areas: string[] }> = {
  a1: {
    sold: 280,
    years: '12+ Years',
    areas: ['London', 'St. Thomas', 'Strathroy', 'Woodstock'],
  },
  a2: {
    sold: 145,
    years: '6 Years',
    areas: ['London', 'Dorchester', 'Komoka', 'Ilderton'],
  },
  a3: {
    sold: 92,
    years: '4 Years',
    areas: ['London', 'Middlesex County', 'Sarnia', 'Chatham'],
  },
};

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

function ContactForm() {
  const [form, setForm] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy-500 mb-2">
          Message Sent!
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Thank you for reaching out. One of our agents will contact you within 2 business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Full Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Your full name"
          className="input-public"
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="you@email.com"
          className="input-public"
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="(519) 000-0000"
          className="input-public"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Tell us about your real estate needs..."
          className="input-public resize-none"
          aria-required="true"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-navy w-full sm:w-auto px-10 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function AgentsPage() {
  return (
    <div className="bg-cream min-h-screen">
      {/* Hero Banner */}
      <div className="bg-navy-500 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-wider mb-3">
            Our Team
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Meet Our Realtors
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Experienced, local professionals dedicated to finding your perfect home and achieving the best results in Ontario's market.
          </p>
        </div>
      </div>

      {/* Agent Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" aria-label="Our real estate agents">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {AGENTS.map((agent, i) => (
            <div
              key={agent._id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
            >
              <AgentCard agent={agent} listingsCount={AGENT_LISTINGS[agent._id] ?? 0} />
            </div>
          ))}
        </div>

        {/* Agent Extended Bios */}
        <div className="mt-16 space-y-8">
          {AGENTS.map((agent, i) => {
            const stats = AGENT_STATS[agent._id];
            return (
              <div
                key={agent._id}
                className="card-public p-6 sm:p-8 flex flex-col sm:flex-row gap-6 animate-slide-up"
                style={{ animationDelay: `${i * 80 + 200}ms`, animationFillMode: 'backwards' }}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-navy-500 flex items-center justify-center text-gold-400 text-2xl font-bold shadow-md">
                    {agent.firstName[0]}{agent.lastName[0]}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="font-display font-bold text-xl text-navy-500">
                        {agent.firstName} {agent.lastName}
                      </h2>
                      <p className="text-gold-600 font-semibold text-sm capitalize">
                        {agent.role === 'broker' ? 'Broker of Record' : 'Sales Representative'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center px-4 py-2 bg-navy-50 rounded-xl">
                        <p className="font-bold text-navy-500 text-lg">{stats?.sold ?? 0}+</p>
                        <p className="text-xs text-gray-400">Sold</p>
                      </div>
                      <div className="text-center px-4 py-2 bg-gold-50 rounded-xl">
                        <p className="font-bold text-gold-700 text-lg">{stats?.years ?? '—'}</p>
                        <p className="text-xs text-gray-400">Experience</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{agent.bio}</p>

                  {/* Service Areas */}
                  {stats?.areas && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Service Areas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {stats.areas.map((area) => (
                          <span
                            key={area}
                            className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex flex-wrap items-center gap-3">
                    {agent.phone && (
                      <a
                        href={`tel:${agent.phone.replace(/\D/g, '')}`}
                        className="flex items-center gap-2 text-sm text-navy-500 hover:text-gold-600 font-semibold transition-colors"
                        aria-label={`Call ${agent.firstName} ${agent.lastName}`}
                      >
                        <Phone className="w-4 h-4" />
                        {agent.phone}
                      </a>
                    )}
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-500 transition-colors"
                      aria-label={`Email ${agent.firstName} ${agent.lastName}`}
                    >
                      <Mail className="w-4 h-4" />
                      {agent.email}
                    </a>
                    {agent.licenseNumber && (
                      <span className="text-xs text-gray-400">
                        License: {agent.licenseNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8" id="contact" aria-label="Contact form">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold-600 text-sm font-semibold uppercase tracking-wider mb-2">
              Get in Touch
            </p>
            <h2 className="section-title text-3xl">Contact Our Team</h2>
            <p className="text-gray-500 mt-2">
              Have questions about buying or selling in Ontario? We'd love to hear from you.
            </p>
          </div>

          <div className="card-public p-6 sm:p-8">
            <ContactForm />
          </div>

          {/* Office Info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: Phone, label: 'Phone', value: '(519) 438-5478', href: 'tel:5194385478' },
              { icon: Mail, label: 'Email', value: 'nuvistarealty@rogers.com', href: 'mailto:nuvistarealty@rogers.com' },
              { icon: CheckCircle2, label: 'Office Hours', value: 'Mon–Sat 9am–6pm', href: undefined },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="card-public p-4">
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-navy-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-semibold text-navy-500 hover:text-gold-600 transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
