import { useState, useEffect } from 'react';
import {
  Search, MapPin, Target, Phone, Mail, Calendar,
  Plus, SlidersHorizontal, ChevronRight, Clock,
  User, Tag, MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Lead, LeadFilters } from '../../types';

const LOCATIONS = ['All Locations', 'Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Burlington', 'Markham', 'Richmond Hill', 'Vaughan', 'Hamilton'];
const STATUSES = ['All', 'new', 'contacted', 'qualified', 'showing', 'offer', 'closed', 'lost'];
const SOURCES = ['All', 'website', 'referral', 'social_media', 'open_house', 'cold_call'];

const statusStyles: Record<string, { bg: string; dot: string }> = {
  new: { bg: 'bg-brand-500/15 text-brand-400', dot: 'bg-brand-400' },
  contacted: { bg: 'bg-sky-500/15 text-sky-400', dot: 'bg-sky-400' },
  qualified: { bg: 'bg-violet-500/15 text-violet-400', dot: 'bg-violet-400' },
  showing: { bg: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
  offer: { bg: 'bg-orange-500/15 text-orange-400', dot: 'bg-orange-400' },
  closed: { bg: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  lost: { bg: 'bg-red-500/15 text-red-400', dot: 'bg-red-400' },
};

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/15';
  if (score >= 60) return 'text-brand-400 bg-brand-500/15';
  if (score >= 40) return 'text-amber-400 bg-amber-500/15';
  return 'text-red-400 bg-red-500/15';
};

function formatBudget(min: number, max: number): string {
  const fmt = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    return `$${(v / 1_000).toFixed(0)}K`;
  };
  return `${fmt(min)} – ${fmt(max)}`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Mock data for demo
const MOCK_LEADS: Lead[] = [
  { _id: '1', firstName: 'Emma', lastName: 'Johnson', fullName: 'Emma Johnson', email: 'emma.johnson@email.com', phone: '416-555-1234', status: 'new', source: 'website', score: 82, assignedAgent: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: '' } as any, interestedIn: [], preferredLocations: ['Toronto', 'Mississauga'], budget: { min: 500000, max: 900000 }, preferredPropertyTypes: ['condo', 'townhouse'], bedrooms: { min: 2, max: 3 }, timeline: '1-3 months', notes: [{ content: 'Looking for a modern condo near transit', author: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell' } as any, createdAt: new Date().toISOString() }], activities: [], tags: ['first-time-buyer', 'pre-approved'], lastContactDate: new Date(Date.now() - 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '2', firstName: 'Raj', lastName: 'Patel', fullName: 'Raj Patel', email: 'raj.patel@email.com', phone: '905-555-5678', status: 'qualified', source: 'referral', score: 91, assignedAgent: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: '' } as any, interestedIn: [], preferredLocations: ['Oakville', 'Burlington'], budget: { min: 1200000, max: 2000000 }, preferredPropertyTypes: ['detached'], bedrooms: { min: 4, max: 5 }, timeline: 'Immediate', notes: [], activities: [], tags: ['upsizing', 'VIP', 'pre-approved'], lastContactDate: new Date(Date.now() - 2 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '3', firstName: 'Wei', lastName: 'Wong', fullName: 'Wei Wong', email: 'wei.wong@email.com', phone: '647-555-9012', status: 'showing', source: 'social_media', score: 75, assignedAgent: { _id: '2', firstName: 'James', lastName: 'Kowalski', email: '' } as any, interestedIn: [], preferredLocations: ['Markham', 'Richmond Hill'], budget: { min: 800000, max: 1400000 }, preferredPropertyTypes: ['detached', 'semi-detached'], bedrooms: { min: 3, max: 4 }, timeline: '3-6 months', notes: [], activities: [], tags: ['investor'], lastContactDate: new Date(Date.now() - 3 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 5 * 86400000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '4', firstName: 'Carlos', lastName: 'Garcia', fullName: 'Carlos Garcia', email: 'carlos.garcia@email.com', phone: '905-555-3456', status: 'contacted', source: 'open_house', score: 45, assignedAgent: { _id: '3', firstName: 'Priya', lastName: 'Nair', email: '' } as any, interestedIn: [], preferredLocations: ['Burlington', 'Hamilton'], budget: { min: 400000, max: 700000 }, preferredPropertyTypes: ['townhouse', 'semi-detached'], bedrooms: { min: 2, max: 3 }, timeline: '6-12 months', notes: [], activities: [], tags: ['first-time-buyer'], lastContactDate: new Date(Date.now() - 7 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: new Date(Date.now() - 21 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '5', firstName: 'Sophia', lastName: 'Brown', fullName: 'Sophia Brown', email: 'sophia.brown@email.com', phone: '416-555-7890', status: 'offer', source: 'referral', score: 95, assignedAgent: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: '' } as any, interestedIn: [], preferredLocations: ['Toronto'], budget: { min: 600000, max: 1100000 }, preferredPropertyTypes: ['condo'], bedrooms: { min: 1, max: 2 }, timeline: 'Immediate', notes: [], activities: [], tags: ['hot-lead', 'VIP', 'pre-approved'], lastContactDate: new Date(Date.now() - 0.5 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '6', firstName: 'Fatima', lastName: 'Hassan', fullName: 'Fatima Hassan', email: 'fatima.h@email.com', phone: '647-555-2345', status: 'closed', source: 'website', score: 88, assignedAgent: { _id: '2', firstName: 'James', lastName: 'Kowalski', email: '' } as any, interestedIn: [], preferredLocations: ['Vaughan', 'Brampton'], budget: { min: 700000, max: 1000000 }, preferredPropertyTypes: ['detached'], bedrooms: { min: 3, max: 4 }, timeline: 'Immediate', notes: [], activities: [], tags: ['relocation'], lastContactDate: new Date(Date.now() - 10 * 86400000).toISOString(), createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '7', firstName: 'Liam', lastName: 'Miller', fullName: 'Liam Miller', email: 'liam.m@email.com', phone: '905-555-6789', status: 'lost', source: 'cold_call', score: 22, assignedAgent: { _id: '3', firstName: 'Priya', lastName: 'Nair', email: '' } as any, interestedIn: [], preferredLocations: ['Toronto'], budget: { min: 300000, max: 500000 }, preferredPropertyTypes: ['condo'], bedrooms: { min: 1, max: 2 }, timeline: 'Just browsing', notes: [], activities: [], tags: [], lastContactDate: new Date(Date.now() - 30 * 86400000).toISOString(), createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: '8', firstName: 'Yuki', lastName: 'Tanaka', fullName: 'Yuki Tanaka', email: 'yuki.t@email.com', phone: '416-555-0011', status: 'new', source: 'advertisement', score: 58, assignedAgent: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: '' } as any, interestedIn: [], preferredLocations: ['Mississauga', 'Toronto'], budget: { min: 550000, max: 850000 }, preferredPropertyTypes: ['condo', 'townhouse'], bedrooms: { min: 2, max: 3 }, timeline: '1-3 months', notes: [], activities: [], tags: ['downsizing'], lastContactDate: undefined, nextFollowUp: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 0.2 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [filters, setFilters] = useState<LeadFilters>({});

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const result = await api.getLeads(filters);
        setLeads(result.data);
      } catch {
        setLeads(MOCK_LEADS);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [filters]);

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;
    setLoading(true);
    try {
      const result = await api.searchLeadsByLocation(locationSearch);
      setLeads(result);
    } catch {
      const filtered = MOCK_LEADS.filter((l) =>
        l.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(locationSearch.toLowerCase())
        )
      );
      setLeads(filtered.length > 0 ? filtered : MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof LeadFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'All' ? '' : value, page: 1 }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Leads</h1>
          <p className="text-slate-500 text-sm mt-0.5">{leads.length} leads in your pipeline</p>
        </div>
        <button className="btn-primary self-start">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Location Search */}
      <div className="glass-card p-5 glow-brand relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <h3 className="font-display font-semibold text-white mb-1">Search Leads by Location</h3>
          <p className="text-slate-500 text-xs mb-4">Find leads interested in specific neighbourhoods and cities</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                placeholder="Enter city or neighbourhood (e.g. Mississauga, Oakville, Yorkville...)"
                className="input-field pl-10 border-brand-500/20 focus:border-brand-500/50"
              />
            </div>
            <button onClick={handleLocationSearch} className="btn-primary">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {LOCATIONS.slice(1, 8).map((loc) => (
              <button
                key={loc}
                onClick={() => { setLocationSearch(loc); }}
                className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all border border-white/[0.04] hover:border-brand-500/20"
              >
                <MapPin className="w-3 h-3 inline mr-1" />{loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="input-field pl-10"
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`btn-ghost ${filtersOpen ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 mt-3 border-t border-white/[0.06] animate-fade-in">
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Status</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Source</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('source', e.target.value)}>
                {SOURCES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Min Score</label>
              <input type="number" placeholder="0" className="input-field text-xs py-2" onChange={(e) => updateFilter('scoreMin', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Sort By</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('sortBy', e.target.value)}>
                <option value="createdAt">Newest First</option>
                <option value="score">Highest Score</option>
                <option value="lastContactDate">Last Contacted</option>
              </select>
            </div>
          </div>
        )}

        {/* Status Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap mt-3">
          {STATUSES.map((status) => {
            const style = statusStyles[status];
            return (
              <button
                key={status}
                onClick={() => updateFilter('status', status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  (filters.status === status || (status === 'All' && !filters.status))
                    ? (style ? style.bg + ' border border-current/20' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30')
                    : 'bg-white/[0.03] text-slate-500 hover:text-white border border-transparent hover:border-white/[0.06]'
                }`}
              >
                {style && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
                {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No leads found</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead, i) => {
            const style = statusStyles[lead.status] || { bg: 'bg-slate-500/15 text-slate-400', dot: 'bg-slate-400' };
            return (
              <div
                key={lead._id}
                onClick={() => setSelectedLead(selectedLead?._id === lead._id ? null : lead)}
                className="glass-card-hover p-4 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/25 to-teal-500/25 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {lead.firstName[0]}{lead.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-white text-sm">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <span className={`status-badge text-[10px] ${style.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {lead.status}
                      </span>
                      <span className={`status-badge text-[10px] ${scoreColor(lead.score)}`}>
                        <Target className="w-3 h-3" />{lead.score}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{lead.email}
                      </span>
                      {lead.phone && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{lead.phone}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{lead.preferredLocations.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-white font-medium">
                      {formatBudget(lead.budget.min, lead.budget.max)}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {lead.source.replace('_', ' ')} · {timeAgo(lead.createdAt)}
                    </span>
                    {lead.nextFollowUp && (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />Follow up {timeAgo(lead.nextFollowUp)}
                      </span>
                    )}
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform flex-shrink-0 ${selectedLead?._id === lead._id ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Detail */}
                {selectedLead?._id === lead._id && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preferences</h4>
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">Budget:</span> {formatBudget(lead.budget.min, lead.budget.max)}
                          </p>
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">Type:</span> {lead.preferredPropertyTypes.join(', ')}
                          </p>
                          {lead.bedrooms && (
                            <p className="text-xs text-slate-300">
                              <span className="text-slate-500">Beds:</span> {lead.bedrooms.min}–{lead.bedrooms.max}
                            </p>
                          )}
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">Timeline:</span> {lead.timeline || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.tags.length > 0 ? lead.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[11px] text-slate-400 border border-white/[0.04]">
                              <Tag className="w-2.5 h-2.5 inline mr-1" />{tag}
                            </span>
                          )) : (
                            <span className="text-xs text-slate-600">No tags</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Note</h4>
                        {lead.notes.length > 0 ? (
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-xs text-slate-300">{lead.notes[lead.notes.length - 1].content}</p>
                            <p className="text-[10px] text-slate-600 mt-1.5">
                              — {lead.notes[lead.notes.length - 1].author.firstName} {lead.notes[lead.notes.length - 1].author.lastName}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">No notes yet</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                      <button className="btn-primary text-xs py-1.5">
                        <Phone className="w-3 h-3" /> Call
                      </button>
                      <button className="btn-ghost text-xs py-1.5">
                        <Mail className="w-3 h-3" /> Email
                      </button>
                      <button className="btn-ghost text-xs py-1.5">
                        <MessageSquare className="w-3 h-3" /> Add Note
                      </button>
                      <button className="btn-ghost text-xs py-1.5">
                        <Calendar className="w-3 h-3" /> Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
