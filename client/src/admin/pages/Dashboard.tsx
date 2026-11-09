import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, CalendarClock, Images, Inbox, MessageSquare, UtensilsCrossed } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { ActivityEntry, ReservationEnquiry } from '../../lib/types';
import { formatDate, formatTime12, shortBranchName, timeAgo } from '../../lib/format';
import { useAuth } from '../auth';
import { Empty, LoadingRows, PageHeader, StatusBadge } from '../ui';
import { ErrorState } from '../../components/ui';

interface Stats {
  branches: number;
  publishedBranches: number;
  unverifiedBranches: number;
  menuItems: number;
  galleryImages: number;
  newReservations: number;
  newContacts: number;
  reservationsThisWeek: number;
  recentActivity: ActivityEntry[];
  latestReservations: (ReservationEnquiry & { branch: { name: string } | null })[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<Stats>('/api/admin/stats');
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const cards = data
    ? [
        { label: 'New table enquiries', value: data.newReservations, Icon: CalendarClock, to: '/admin/enquiries', accent: true },
        { label: 'New messages', value: data.newContacts, Icon: MessageSquare, to: '/admin/enquiries?tab=contacts', accent: data.newContacts > 0 },
        { label: 'Branches', value: data.branches, sub: `${data.publishedBranches} published`, Icon: Building2, to: '/admin/branches' },
        { label: 'Menu items', value: data.menuItems, Icon: UtensilsCrossed, to: '/admin/menu' },
        { label: 'Gallery images', value: data.galleryImages, Icon: Images, to: '/admin/gallery' },
        { label: 'Enquiries this week', value: data.reservationsThisWeek, Icon: Inbox, to: '/admin/enquiries' },
      ]
    : [];

  return (
    <>
      <PageHeader title={`${greet}, ${user?.name.split(' ')[0]}`} text="Here’s what’s happening on your website." />

      {data && data.unverifiedBranches > 0 && (
        <Link to="/admin/branches" className="mb-6 flex items-start gap-3 rounded-2xl border border-saffron-300 bg-saffron-50 p-4 text-sm text-saffron-700 transition hover:bg-saffron-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            <strong>{data.unverifiedBranches} branch{data.unverifiedBranches > 1 ? 'es' : ''} need verified details.</strong> Add or confirm the address, phone number and timings, then turn on “Details verified”.
          </span>
          <ArrowRight className="ml-auto mt-0.5 h-4 w-4 shrink-0" />
        </Link>
      )}

      {loading && !data ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ label, value, sub, Icon, to, accent }) => (
            <Link key={label} to={to} className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-card ${accent && value > 0 ? 'border-saffron-300 bg-white' : 'border-ink-900/[0.07] bg-white'}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-charcoal-400">{label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${accent && value > 0 ? 'bg-saffron-100 text-saffron-700' : 'bg-cream-200 text-ink-600'}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-4xl font-semibold text-ink-700">{value}</p>
              {sub && <p className="mt-1 text-xs text-charcoal-300">{sub}</p>}
            </Link>
          ))}
        </div>
      )}

      {data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-4">
              <h2 className="font-display text-lg">Latest table enquiries</h2>
              <Link to="/admin/enquiries" className="text-sm text-ink-600 hover:underline">View all</Link>
            </div>
            {data.latestReservations.length === 0 ? (
              <Empty text="No enquiries yet. They will appear here as soon as guests send them." />
            ) : (
              <ul className="divide-y divide-ink-900/[0.07]">
                {data.latestReservations.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="font-medium text-charcoal">{r.name} <span className="text-charcoal-300">· {r.guests} guests</span></p>
                      <p className="text-xs text-charcoal-400">
                        {r.branch ? shortBranchName(r.branch.name) : '—'} · {formatDate(r.date, { day: 'numeric', month: 'short' })}, {formatTime12(r.time)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/10 px-6 py-4">
              <h2 className="font-display text-lg">Recent activity</h2>
            </div>
            {data.recentActivity.length === 0 ? (
              <Empty text="No activity yet." />
            ) : (
              <ul className="max-h-[420px] divide-y divide-ink-900/[0.07] overflow-y-auto">
                {data.recentActivity.map((a) => (
                  <li key={a.id} className="px-6 py-3.5">
                    <p className="text-sm text-charcoal-600">{a.summary}</p>
                    <p className="mt-0.5 text-xs text-charcoal-300">{a.admin?.name ?? 'System'} · {timeAgo(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
