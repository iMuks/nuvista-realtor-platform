import { Phone, Mail, Award } from 'lucide-react';
import type { User } from '../../types';

interface AgentCardProps {
  agent: User;
  listingsCount?: number;
}

const AVATAR_COLORS = [
  { bg: '#0f2b52', text: '#beaf87' },
  { bg: '#1e3a5f', text: '#c6b37e' },
  { bg: '#0b1d3a', text: '#d4c59a' },
];

const roleLabel: Record<string, string> = {
  broker: 'Broker of Record',
  agent:  'Sales Representative',
  admin:  'Administrator',
};

export default function AgentCard({ agent, listingsCount = 0 }: AgentCardProps) {
  const initials = `${agent.firstName[0] ?? ''}${agent.lastName[0] ?? ''}`.toUpperCase();
  const colorIdx = agent._id.charCodeAt(0) % AVATAR_COLORS.length;
  const colors   = AVATAR_COLORS[colorIdx];

  return (
    <article
      className="group relative overflow-hidden bg-white rounded-2xl transition-all duration-500 flex flex-col"
      style={{
        boxShadow: '0 2px 16px rgba(15,43,82,0.07), 0 1px 4px rgba(15,43,82,0.04)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 20px 60px rgba(15,43,82,0.15), 0 6px 20px rgba(15,43,82,0.08)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 2px 16px rgba(15,43,82,0.07), 0 1px 4px rgba(15,43,82,0.04)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* ── Top navy band ── */}
      <div
        className="h-24 relative flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, #0d2449 100%)` }}
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(190,175,135,0.5) 0%, transparent 60%)',
          }}
        />
        {/* Active badge */}
        {agent.isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5
                          bg-emerald-500/20 border border-emerald-400/30 rounded-full px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[10px] text-emerald-300 font-semibold">Available</span>
          </div>
        )}
      </div>

      {/* ── Avatar (overlapping the band) ── */}
      <div className="px-6 -mt-10 mb-4 relative z-10">
        {agent.avatar ? (
          <img
            src={agent.avatar}
            alt={`${agent.firstName} ${agent.lastName}`}
            className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg
                       flex items-center justify-center text-2xl font-bold font-display"
            style={{ background: colors.bg, color: colors.text }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="px-6 pb-6 flex flex-col flex-1">
        {/* Name + role */}
        <div className="mb-3">
          <h3 className="font-display font-bold text-navy-500 text-lg leading-tight
                         group-hover:text-navy-600 transition-colors">
            {agent.firstName} {agent.lastName}
          </h3>
          <p className="text-[12.5px] font-semibold text-gold-600 mt-0.5">
            {roleLabel[agent.role] ?? agent.role}
          </p>
          {agent.brokerage && (
            <p className="text-[12px] text-gray-400 mt-0.5">{agent.brokerage}</p>
          )}
        </div>

        {/* Bio */}
        {agent.bio && (
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
            {agent.bio}
          </p>
        )}

        {/* Listings count */}
        {listingsCount > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-gold-500" />
            <span className="text-[12.5px] font-semibold text-navy-500">
              {listingsCount} Active Listing{listingsCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-4" />

        {/* Contact buttons */}
        <div className="flex flex-col gap-2">
          {agent.phone && (
            <a
              href={`tel:${agent.phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                         bg-navy-500 hover:bg-navy-600 text-white text-[13px] font-semibold
                         transition-all duration-200 shadow-sm shadow-navy-500/20"
              aria-label={`Call ${agent.firstName}`}
            >
              <Phone className="w-3.5 h-3.5" />
              {agent.phone}
            </a>
          )}
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900
                       text-[13px] font-medium transition-all duration-200 border border-gray-100"
            aria-label={`Email ${agent.firstName}`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{agent.email}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
