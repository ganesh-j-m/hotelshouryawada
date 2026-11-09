import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Mail, MessageCircle, Phone, Search, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { Branch, ContactEnquiry, EnquiryStatus, Paged, ReservationEnquiry } from '../../lib/types';
import { api, API_BASE } from '../../lib/api';
import { formatDate, formatDateTime, formatTime12, shortBranchName, telHref, waHref } from '../../lib/format';
import { useAuth } from '../auth';
import { ConfirmDialog, Empty, LoadingRows, Modal, PageHeader, StatusBadge, errorText, useToast } from '../ui';
import { ErrorState } from '../../components/ui';

const STATUSES: EnquiryStatus[] = ['NEW', 'CONTACTED', 'CONFIRMED', 'CLOSED', 'CANCELLED'];
type Kind = 'reservations' | 'contacts';
type Row = ReservationEnquiry | ContactEnquiry;
const isReservation = (r: Row): r is ReservationEnquiry => 'guests' in r;

export default function EnquiriesAdmin() {
  const toast = useToast();
  const { user } = useAuth();
  const canDelete = user?.role !== 'EDITOR';
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get('tab') === 'contacts' ? 'contacts' : 'reservations';
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<Row | null>(null);
  const [busyDel, setBusyDel] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [kind, status, branchId, debouncedQ]);

  const qs = new URLSearchParams({ ...(status && { status }), ...(branchId && { branchId }), ...(debouncedQ && { q: debouncedQ }) }).toString();
  const { data, loading, error, reload } = useFetch<Paged<Row>>(`/api/admin/enquiries/${kind}?page=${page}${qs ? `&${qs}` : ''}`);
  const branches = useFetch<Branch[]>('/api/admin/branches');
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const openRow = (r: Row) => {
    setSelected(r);
    setNotes(r.internalNotes ?? '');
  };

  async function update(r: Row, patch: { status?: EnquiryStatus; internalNotes?: string }) {
    setSaving(true);
    try {
      const updated = await api.patch<Row>(`/api/admin/enquiries/${kind}/${r.id}`, patch);
      const merged = { ...r, ...updated, branch: r.branch } as Row;
      setSelected((s) => (s?.id === r.id ? merged : s));
      reload();
      toast('success', 'Enquiry updated.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!del) return;
    setBusyDel(true);
    try {
      await api.del(`/api/admin/enquiries/${kind}/${del.id}`);
      toast('success', 'Enquiry deleted.');
      setDel(null);
      setSelected(null);
      reload();
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusyDel(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/enquiries/${kind}/export.csv${qs ? `?${qs}` : ''}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kind === 'reservations' ? 'table' : 'contact'}-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('error', 'Could not export. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Enquiries"
        text="Table enquiries are requests only — call the guest to confirm, then mark them Confirmed."
        actions={<button className="btn-outline btn-sm" onClick={exportCsv} disabled={exporting}><Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}</button>}
      />

      <div className="mb-5 inline-flex rounded-xl bg-white p-1 shadow-card" role="tablist">
        {(['reservations', 'contacts'] as Kind[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setParams(k === 'contacts' ? { tab: 'contacts' } : {})}
            className={`rounded-lg px-4 py-2 text-sm ${kind === k ? 'bg-ink-600 text-cream' : 'text-charcoal-600 hover:bg-cream-200'}`}
          >
            {k === 'reservations' ? 'Table enquiries' : 'Contact messages'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="grid gap-3 border-b border-ink-900/10 p-4 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search by name, phone or email</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
            <input className="input py-2.5 pl-10 text-sm" placeholder="Search name, phone or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="input py-2.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <select className="input py-2.5 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label="Filter by branch">
            <option value="">All branches</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{shortBranchName(b.name)}</option>)}
          </select>
        </div>

        {error ? (
          <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data || data.items.length === 0 ? (
          <Empty text="No enquiries match these filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-cream-100 text-xs uppercase tracking-wider text-charcoal-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Guest</th>
                    <th className="px-5 py-3 font-medium">{kind === 'reservations' ? 'Visit' : 'Subject'}</th>
                    <th className="px-5 py-3 font-medium">Branch</th>
                    <th className="px-5 py-3 font-medium">Received</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/[0.07]">
                  {data.items.map((r) => (
                    <tr key={r.id} onClick={() => openRow(r)} className={`cursor-pointer transition hover:bg-cream-100 ${r.status === 'NEW' ? 'bg-saffron-50/40' : ''}`}>
                      <td className="px-5 py-3.5">
                        <button className="text-left font-medium text-charcoal hover:text-ink-600" onClick={(e) => { e.stopPropagation(); openRow(r); }}>
                          {r.name}
                        </button>
                        <p className="text-xs text-charcoal-400">{r.phone || r.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-charcoal-600">
                        {isReservation(r) ? (
                          <>
                            {formatDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}, {formatTime12(r.time)}
                            <span className="block text-xs text-charcoal-400">{r.guests} guests</span>
                          </>
                        ) : (
                          <span className="line-clamp-2">{r.subject}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-charcoal-600">{r.branch ? shortBranchName(r.branch.name) : '—'}</td>
                      <td className="px-5 py-3.5 text-xs text-charcoal-400">{formatDateTime(r.createdAt)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-ink-900/10 px-5 py-3 text-sm text-charcoal-400">
              <span>{data.total} total</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 hover:bg-cream-200 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                <span>Page {page} of {pages}</span>
                <button className="rounded-lg p-2 hover:bg-cream-200 disabled:opacity-40" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? (isReservation(selected) ? 'Table enquiry' : 'Contact message') : ''}
        footer={
          selected && (
            <>
              {canDelete && (
                <button className="btn btn-sm mr-auto text-ink-500 hover:bg-ink-50" onClick={() => setDel(selected)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
              <button className="btn-ink btn-sm" disabled={saving || notes === (selected.internalNotes ?? '')} onClick={() => update(selected, { internalNotes: notes })}>
                Save notes
              </button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-ink-700">{selected.name}</p>
                <p className="text-xs text-charcoal-400">Received {formatDateTime(selected.createdAt)} · Ref {selected.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.phone && <a href={telHref(selected.phone)} className="btn-outline btn-sm"><Phone className="h-4 w-4" /> {selected.phone}</a>}
              {selected.phone && <a href={waHref(selected.phone, `Namaskar ${selected.name}, this is Hotel Shauryawada regarding your enquiry.`)} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              {selected.email && <a href={`mailto:${selected.email}`} className="btn-outline btn-sm"><Mail className="h-4 w-4" /> Email</a>}
            </div>

            <dl className="grid gap-4 rounded-xl bg-cream-100 p-5 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-charcoal-400">Branch</dt><dd className="mt-0.5 font-medium">{selected.branch?.name ?? '—'}</dd></div>
              {isReservation(selected) ? (
                <>
                  <div><dt className="text-xs text-charcoal-400">Date & time</dt><dd className="mt-0.5 font-medium">{formatDate(selected.date, { weekday: 'long', day: 'numeric', month: 'long' })}, {formatTime12(selected.time)}</dd></div>
                  <div><dt className="text-xs text-charcoal-400">Guests</dt><dd className="mt-0.5 font-medium">{selected.guests}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-xs text-charcoal-400">Special request</dt><dd className="mt-0.5 whitespace-pre-line">{selected.specialRequest || '—'}</dd></div>
                </>
              ) : (
                <>
                  <div><dt className="text-xs text-charcoal-400">Subject</dt><dd className="mt-0.5 font-medium">{selected.subject}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-xs text-charcoal-400">Message</dt><dd className="mt-0.5 whitespace-pre-line">{selected.message}</dd></div>
                </>
              )}
            </dl>

            <div>
              <p className="label">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={saving}
                    onClick={() => update(selected, { status: s })}
                    aria-pressed={selected.status === s}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${selected.status === s ? 'border-ink-600 bg-ink-600 text-cream' : 'border-ink-900/15 hover:border-saffron-400'}`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="label">Internal notes (staff only)</span>
              <textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Called at 5 PM, confirmed family section for 6" />
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} title="Delete enquiry?" text={`The enquiry from ${del?.name} will be permanently deleted.`} onClose={() => setDel(null)} onConfirm={remove} busy={busyDel} />
    </>
  );
}
