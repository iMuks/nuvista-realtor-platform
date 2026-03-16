import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useMarketStats } from '../../hooks/useProperties';

function formatPrice(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function AnimatedNumber({
  value, prefix = '', suffix = '', decimals = 0,
}: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current || value === 0) return;
    animated.current = true;
    const duration = 1400;
    const steps    = 60;
    const inc      = value / steps;
    let cur        = 0;
    const tick = setInterval(() => {
      cur += inc;
      if (cur >= value) { setDisplayed(value); clearInterval(tick); }
      else              { setDisplayed(parseFloat(cur.toFixed(decimals))); }
    }, duration / steps);
    return () => clearInterval(tick);
  }, [value, decimals]);

  const display = decimals > 0 ? displayed.toFixed(decimals) : displayed.toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

interface StatItem {
  label: string;
  display: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  delta: string;
  sublabel?: string;
}

export default function MarketStats() {
  const { data: stats, isLoading } = useMarketStats();

  const items: StatItem[] = stats ? [
    {
      label: 'Active Listings',
      display: <AnimatedNumber value={stats.totalActive} />,
      trend: 'up',
      delta: '+8 this week',
    },
    {
      label: 'Avg. List Price',
      display: <span>{formatPrice(stats.avgListPrice)}</span>,
      trend: 'up',
      delta: '+2.3%',
      sublabel: 'vs. last month',
    },
    {
      label: 'Sold This Month',
      display: <AnimatedNumber value={stats.soldThisMonth} />,
      trend: 'up',
      delta: '+12 homes',
      sublabel: 'vs. last month',
    },
    {
      label: 'Avg. Days on Market',
      display: <AnimatedNumber value={stats.avgDaysOnMarket} suffix=" days" />,
      trend: 'down',
      delta: '−3 days',
      sublabel: 'vs. last month',
    },
    {
      label: 'Conversion Rate',
      display: <AnimatedNumber value={stats.conversionRate} suffix="%" decimals={1} />,
      trend: 'up',
      delta: '+1.2%',
      sublabel: 'vs. last month',
    },
  ] : [];

  return (
    <section
      className="bg-navy-900 border-b border-white/5"
      aria-label="Live market statistics"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

        {/* ── Header row ── */}
        <div className="flex items-center justify-between py-2.5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.14em]">
              Live Market Data
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-[10px] text-emerald-400/70 font-medium">Live</span>
            </span>
          </div>
          <span className="text-[11px] text-white/25 font-medium hidden sm:block">
            Refreshes every 60s
          </span>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-white/[0.06]">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 py-5 px-5">
                  <div className="skeleton h-7 w-20 rounded-lg" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
              ))
            : items.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col py-5 px-4 sm:px-5 group
                             hover:bg-white/[0.03] transition-colors duration-200"
                >
                  {/* Value */}
                  <p className="font-display font-bold text-white leading-none mb-1.5"
                     style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)' }}>
                    {item.display}
                  </p>

                  {/* Label */}
                  <p className="text-[11.5px] text-white/40 font-medium mb-2 tracking-[0.01em]">
                    {item.label}
                  </p>

                  {/* Trend */}
                  <div className="flex items-center gap-1.5 mt-auto">
                    {item.trend === 'up'   && <TrendingUp   className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                    {item.trend === 'down' && <TrendingDown  className="w-3 h-3 text-blue-400   flex-shrink-0" />}
                    <span className={`text-[10.5px] font-semibold ${
                      item.trend === 'up'   ? 'text-emerald-400' :
                      item.trend === 'down' ? 'text-blue-400'    : 'text-white/30'
                    }`}>
                      {item.delta}
                    </span>
                    {item.sublabel && (
                      <span className="text-[10px] text-white/20 font-medium">{item.sublabel}</span>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
