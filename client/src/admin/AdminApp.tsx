import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Building2,
  ExternalLink,
  Images,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu as MenuIcon,
  Quote,
  Settings,
  UserCog,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './auth';
import { ToastProvider, errorText } from './ui';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const BranchesAdmin = lazy(() => import('./pages/BranchesAdmin'));
const MenuAdmin = lazy(() => import('./pages/MenuAdmin'));
const GalleryAdmin = lazy(() => import('./pages/GalleryAdmin'));
const FounderAdmin = lazy(() => import('./pages/FounderAdmin'));
const SettingsAdmin = lazy(() => import('./pages/SettingsAdmin'));
const EnquiriesAdmin = lazy(() => import('./pages/EnquiriesAdmin'));
const UsersAdmin = lazy(() => import('./pages/UsersAdmin'));
const AccountAdmin = lazy(() => import('./pages/AccountAdmin'));

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/enquiries', label: 'Enquiries', Icon: Inbox },
  { to: '/admin/branches', label: 'Branches', Icon: Building2 },
  { to: '/admin/menu', label: 'Menu', Icon: UtensilsCrossed },
  { to: '/admin/gallery', label: 'Gallery', Icon: Images },
  { to: '/admin/founder', label: 'Founder’s Message', Icon: Quote },
  { to: '/admin/settings', label: 'Website Content', Icon: Settings },
];

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pattern-saffron relative flex min-h-screen items-center justify-center p-5">
      <form onSubmit={submit} className="relative w-full max-w-sm animate-fade-up rounded-3xl bg-cream p-8 shadow-2xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="Hotel Shauryawada logo" className="h-24 w-24 animate-float rounded-full shadow-lift" />
          <h1 className="mt-5 font-display text-2xl font-semibold">Hotel Shauryawada</h1>
          <p className="mt-1 text-sm text-charcoal-400">Admin Dashboard</p>
        </div>
        {error && <p className="mt-6 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600" role="alert">{error}</p>}
        <label className="mt-6 block">
          <span className="label">Email</span>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn-ink mt-7 w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </button>
        <Link to="/" className="mt-6 block text-center text-xs text-charcoal-400 hover:text-ink-600">← Back to website</Link>
      </form>
    </div>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const nav = [
    ...NAV,
    ...(user?.role === 'OWNER' ? [{ to: '/admin/users', label: 'Staff Accounts', Icon: UserCog }] : []),
    { to: '/admin/account', label: 'My Account', Icon: KeyRound },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <img src="/logo.png" alt="" className="h-11 w-11 rounded-full ring-2 ring-saffron-400/50" />
        <div className="leading-tight">
          <p className="font-display text-base text-cream">Shauryawada</p>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-saffron-300/80">Admin</p>
        </div>
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {nav.map(({ to, label, Icon, ...rest }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={'end' in rest}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${isActive ? 'bg-gradient-to-r from-saffron-600 to-saffron-500 text-white shadow-glow' : 'text-cream/75 hover:bg-cream/5 hover:text-cream'}`
                }
              >
                <Icon className="h-[18px] w-[18px]" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-cream/10 p-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-cream/75 hover:bg-cream/5 hover:text-cream">
          <ExternalLink className="h-[18px] w-[18px]" /> View website
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-cream/75 hover:bg-cream/5 hover:text-cream">
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
        <p className="mt-3 truncate px-4 text-xs text-cream/45">
          {user?.name} · {user?.role.toLowerCase()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      <aside className="pattern-ink fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink-700 px-4 py-3 text-cream lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-cream/10" aria-label="Open admin menu">
          <MenuIcon className="h-6 w-6" />
        </button>
        <p className="font-display">Shauryawada Admin</p>
        <span className="w-10" />
      </div>
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <aside className={`pattern-ink absolute inset-y-0 left-0 w-72 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <button onClick={() => setOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-cream hover:bg-cream/10" aria-label="Close admin menu">
            <X className="h-5 w-5" />
          </button>
          {sidebar}
        </aside>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-saffron-500" /></div>}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="enquiries" element={<EnquiriesAdmin />} />
              <Route path="branches" element={<BranchesAdmin />} />
              <Route path="menu" element={<MenuAdmin />} />
              <Route path="gallery" element={<GalleryAdmin />} />
              <Route path="founder" element={<FounderAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
              <Route path="users" element={user?.role === 'OWNER' ? <UsersAdmin /> : <Navigate to="/admin" replace />} />
              <Route path="account" element={<AccountAdmin />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function Gate() {
  const { user, checking } = useAuth();
  if (checking) {
    return (
      <div className="pattern-saffron relative flex min-h-screen items-center justify-center">
        <Loader2 className="relative h-8 w-8 animate-spin text-white" />
      </div>
    );
  }
  return user ? <Shell /> : <Login />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Helmet>
          <title>Admin | Hotel Shauryawada</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <Gate />
      </ToastProvider>
    </AuthProvider>
  );
}
