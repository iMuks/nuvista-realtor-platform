import { useState, useEffect } from 'react';
import {
  Building2, Users, TrendingUp, Clock, DollarSign, Target,
  ArrowUpRight, MapPin,
  Bed, Bath, ChevronRight,
} from 'lucide-react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { api } from '../../services/api';
import type { DashboardData } from '../../types';

// ── Formatters ───────────────────────────────────────────
function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}


// ── Status Colors ────────────────────────────────────────
const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  sold: 'bg-blue-500/15 text-blue-400',
  pending: 'bg-amber-500/15 text-amber-400',
  coming_soon: 'bg-purple-500/15 text-purple-400',
  new: 'bg-brand-500/15 text-brand-400',
  contacted: 'bg-sky-500/15 text-sky-400',
  qualified: 'bg-violet-500/15 text-violet-400',
  showing: 'bg-amber-500/15 text-amber-400',
  offer: 'bg-orange-500/15 text-orange-400',
  closed: 'bg-emerald-500/15 text-emerald-400',
  lost: 'bg-red-500/15 text-red-400',
};

const leadScoreColor = (score: number): string => {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
};

const CHART_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6'];

// ── Mock data for demo when API isn't connected ──────────
const MOCK_DASHBOARD: DashboardData = {
  kpis: {
    totalListings: 42, activeListings: 28, totalLeads: 156,
    newLeadsThisWeek: 12, totalSold: 18, soldThisMonth: 3,
    averageDaysOnMarket: 24, totalRevenue: 14250000, conversionRate: 11.5,
  },
  recentProperties: [
    { _id: '1', title: '4 Bed Detached in Liberty Village', propertyType: 'detached', status: 'active', address: { street: '123 King St', city: 'Toronto', province: 'Ontario', postalCode: 'M5V 1K4', country: 'Canada', location: { type: 'Point', coordinates: [-79.4, 43.64] } }, price: 1299000, bedrooms: 4, bathrooms: 3, squareFeet: 2800, images: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', isPrimary: true }], views: 234, favorites: 18, listedDate: new Date(Date.now() - 5 * 86400000).toISOString() } as any,
    { _id: '2', title: '2 Bed Condo in Yorkville', propertyType: 'condo', status: 'active', address: { street: '88 Bloor St', city: 'Toronto', province: 'Ontario', postalCode: 'M5S 1M5', country: 'Canada', location: { type: 'Point', coordinates: [-79.39, 43.67] } }, price: 849000, bedrooms: 2, bathrooms: 2, squareFeet: 1100, images: [{ url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop', isPrimary: true }], views: 189, favorites: 12, listedDate: new Date(Date.now() - 3 * 86400000).toISOString() } as any,
    { _id: '3', title: '3 Bed Townhouse in Port Credit', propertyType: 'townhouse', status: 'pending', address: { street: '45 Lakeshore Rd', city: 'Mississauga', province: 'Ontario', postalCode: 'L5H 1E4', country: 'Canada', location: { type: 'Point', coordinates: [-79.59, 43.55] } }, price: 975000, bedrooms: 3, bathrooms: 2, squareFeet: 1800, images: [{ url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', isPrimary: true }], views: 312, favorites: 24, listedDate: new Date(Date.now() - 12 * 86400000).toISOString() } as any,
    { _id: '4', title: '5 Bed Detached in Oakville', propertyType: 'detached', status: 'sold', address: { street: '200 Oak Ave', city: 'Oakville', province: 'Ontario', postalCode: 'L6J 3Z5', country: 'Canada', location: { type: 'Point', coordinates: [-79.71, 43.39] } }, price: 2150000, bedrooms: 5, bathrooms: 4, squareFeet: 3600, images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop', isPrimary: true }], views: 456, favorites: 31, listedDate: new Date(Date.now() - 45 * 86400000).toISOString() } as any,
  ],
  recentLeads: [
    { _id: '1', firstName: 'Emma', lastName: 'Johnson', email: 'emma@email.com', status: 'new', score: 82, source: 'website', preferredLocations: ['Toronto', 'Mississauga'], createdAt: new Date(Date.now() - 1 * 86400000).toISOString() } as any,
    { _id: '2', firstName: 'Raj', lastName: 'Patel', email: 'raj@email.com', status: 'qualified', score: 91, source: 'referral', preferredLocations: ['Oakville'], createdAt: new Date(Date.now() - 2 * 86400000).toISOString() } as any,
    { _id: '3', firstName: 'Wei', lastName: 'Wong', email: 'wei@email.com', status: 'showing', score: 75, source: 'social_media', preferredLocations: ['Markham', 'Richmond Hill'], createdAt: new Date(Date.now() - 3 * 86400000).toISOString() } as any,
    { _id: '4', firstName: 'Carlos', lastName: 'Garcia', email: 'carlos@email.com', status: 'contacted', score: 45, source: 'open_house', preferredLocations: ['Burlington'], createdAt: new Date(Date.now() - 4 * 86400000).toISOString() } as any,
    { _id: '5', firstName: 'Sophia', lastName: 'Brown', email: 'sophia@email.com', status: 'offer', score: 95, source: 'referral', preferredLocations: ['Toronto'], createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString() } as any,
  ],
  monthlyPerformance: [
    { month: '2025-10', listings: 8, sold: 3, revenue: 2850000 },
    { month: '2025-11', listings: 6, sold: 4, revenue: 3200000 },
    { month: '2025-12', listings: 10, sold: 2, revenue: 1800000 },
    { month: '2026-01', listings: 7, sold: 5, revenue: 4100000 },
    { month: '2026-02', listings: 9, sold: 3, revenue: 2650000 },
    { month: '2026-03', listings: 5, sold: 1, revenue: 950000 },
  ],
  topNeighbourhoods: [
    { name: 'Liberty Village', count: 8, avgPrice: 1150000 },
    { name: 'Yorkville', count: 6, avgPrice: 1450000 },
    { name: 'Port Credit', count: 5, avgPrice: 890000 },
    { name: 'Unionville', count: 4, avgPrice: 1250000 },
    { name: 'Bronte', count: 3, avgPrice: 1680000 },
  ],
  leadPipeline: { new: 32, contacted: 28, qualified: 18, showing: 12, offer: 8, closed: 5, lost: 10 },
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(MOCK_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getDashboard();
        setData(result);
      } catch {
        setData(MOCK_DASHBOARD);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { kpis } = data;
  const pipelineData = Object.entries(data.leadPipeline).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back. Here's your market overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Active Listings', value: kpis.activeListings, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total Leads', value: kpis.totalLeads, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10', sub: `+${kpis.newLeadsThisWeek} this week` },
          { label: 'Sold This Month', value: kpis.soldThisMonth, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Avg Days on Market', value: kpis.averageDaysOnMarket, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), icon: DollarSign, color: 'text-brand-400', bg: 'bg-brand-500/10', sub: `${kpis.conversionRate}% conversion` },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            className="glass-card p-4 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-[18px] h-[18px] ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            {kpi.sub && (
              <p className="text-xs text-brand-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {kpi.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.monthlyPerformance}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
                tickFormatter={(v: string) => {
                  const [, m] = v.split('-');
                  return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(m)];
                }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
                tickFormatter={(v: number) => formatCurrency(v)}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="url(#colorRevenue)" strokeWidth={2} />
              <Bar dataKey="listings" fill="rgba(14,165,233,0.4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sold" fill="rgba(139,92,246,0.5)" radius={[4, 4, 0, 0]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Pipeline Pie */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Lead Pipeline</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                stroke="none"
              >
                {pipelineData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {pipelineData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-slate-400 capitalize">{item.name}</span>
                <span className="ml-auto text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Properties */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Listings</h3>
            <a href="/dashboard/properties" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {data.recentProperties.slice(0, 4).map((prop: any) => (
              <div key={prop._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  {prop.images?.[0] && (
                    <img
                      src={prop.images[0].url}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{prop.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{prop.address.city}
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Bed className="w-3 h-3" />{prop.bedrooms}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Bath className="w-3 h-3" />{prop.bathrooms}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(prop.price)}</p>
                  <span className={`status-badge text-[10px] ${statusColors[prop.status] || 'bg-slate-500/15 text-slate-400'}`}>
                    {prop.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Leads</h3>
            <a href="/dashboard/leads" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {data.recentLeads.slice(0, 5).map((lead: any) => (
              <div key={lead._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/30 to-teal-500/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{lead.firstName} {lead.lastName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{lead.preferredLocations?.[0] || 'N/A'}
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500 capitalize">{lead.source?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <span className={`status-badge text-[10px] ${statusColors[lead.status] || 'bg-slate-500/15 text-slate-400'}`}>
                    {lead.status}
                  </span>
                  <p className={`text-xs font-mono font-semibold ${leadScoreColor(lead.score)}`}>
                    <Target className="w-3 h-3 inline mr-0.5" />{lead.score}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Neighbourhoods */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-white mb-4">Top Neighbourhoods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {data.topNeighbourhoods.map((n, i) => (
            <div
              key={n.name}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-brand-500/20 hover:bg-brand-500/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-[10px] font-bold text-brand-400">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-white truncate">{n.name}</span>
              </div>
              <p className="text-lg font-display font-bold text-white">{formatCurrency(n.avgPrice)}</p>
              <p className="text-xs text-slate-500">{n.count} active listings</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
