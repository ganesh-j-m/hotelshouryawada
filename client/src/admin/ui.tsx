import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Trash2, UploadCloud, X, XCircle } from 'lucide-react';
import { api, ApiError, mediaUrl } from '../lib/api';
import type { EnquiryStatus } from '../lib/types';

// ── Toasts ──────────────────────────────────────────────────

type Toast = { id: number; type: 'success' | 'error'; text: string };
const ToastCtx = createContext<(type: Toast['type'], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((type: Toast['type'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-lift">
            {t.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="h-5 w-5 shrink-0 text-ink-500" />}
            <p className="flex-1 text-charcoal-600">{t.text}</p>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss" className="text-charcoal-300 hover:text-charcoal">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong.');

// ── Modal & confirm ─────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-charcoal/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full ${size} animate-fade-up flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-4">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-charcoal-400 hover:bg-cream-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-900/10 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
  busy,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        <>
          <button className="btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm bg-ink-500 text-white hover:bg-ink-600" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-6 w-6 shrink-0 text-ink-400" />
        <p className="text-sm text-charcoal-600">{text}</p>
      </div>
    </Modal>
  );
}

// ── Form bits ───────────────────────────────────────────────

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-ink-600' : 'bg-charcoal-300/50'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-charcoal-600">{label}</span>
        {hint && <span className="block text-xs text-charcoal-300">{hint}</span>}
      </span>
    </label>
  );
}

export function AField({ label, children, hint, error, className = '' }: { label: string; children: ReactNode; hint?: string; error?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-ink-500">{error}</span> : hint ? <span className="mt-1 block text-xs text-charcoal-300">{hint}</span> : null}
    </label>
  );
}

export function ImageUpload({
  value,
  onChange,
  kind,
  label = 'Image',
  aspect = 'aspect-[16/10]',
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  kind: 'branch' | 'menu' | 'gallery' | 'founder' | 'site';
  label?: string;
  aspect?: string;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function upload(file?: File | null) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast('error', 'Please choose a JPG, PNG or WebP image.');
    if (file.size > 5 * 1024 * 1024) return toast('error', 'Image must be smaller than 5 MB.');
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    try {
      const res = await api.post<{ url: string }>(`/api/admin/upload?kind=${kind}`, fd);
      onChange(res.url);
      toast('success', 'Image uploaded — remember to save.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed ${aspect} ${drag ? 'border-saffron-500 bg-saffron-50' : 'border-ink-900/15 bg-cream-100'}`}
      >
        {value ? (
          <>
            <img src={mediaUrl(value)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
              <button type="button" onClick={() => input.current?.click()} className="btn btn-sm bg-white/90 text-charcoal hover:bg-white">
                <ImagePlus className="h-4 w-4" /> Replace
              </button>
              <button type="button" onClick={() => onChange(null)} className="btn btn-sm bg-white/90 text-ink-600 hover:bg-white" aria-label="Remove image">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-sm text-charcoal-400 hover:text-ink-600">
            <UploadCloud className="h-7 w-7" />
            <span>Click or drop an image</span>
            <span className="text-xs text-charcoal-300">JPG, PNG or WebP · max 5 MB</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-7 w-7 animate-spin text-ink-600" />
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

// ── Display bits ────────────────────────────────────────────

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  NEW: 'bg-saffron-100 text-saffron-700 border-saffron-300',
  CONTACTED: 'bg-sky-50 text-sky-700 border-sky-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-charcoal-300/10 text-charcoal-400 border-charcoal-300/30',
  CANCELLED: 'bg-ink-50 text-ink-500 border-ink-200',
};
export const StatusBadge = ({ status }: { status: EnquiryStatus }) => (
  <span className={`chip ${STATUS_STYLE[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
);

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {text && <p className="mt-1 text-sm text-charcoal-400">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-3 p-6" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-cream-200" />
      ))}
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 p-12 text-center">
      <p className="text-sm text-charcoal-400">{text}</p>
      {action}
    </div>
  );
}
