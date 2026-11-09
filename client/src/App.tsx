import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageLoader } from './components/ui';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Branches = lazy(() => import('./pages/Branches'));
const BranchDetail = lazy(() => import('./pages/BranchDetail'));
const MenuPage = lazy(() => import('./pages/Menu'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Founder = lazy(() => import('./pages/Founder'));
const Contact = lazy(() => import('./pages/Contact'));
const Reserve = lazy(() => import('./pages/Reserve'));
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })));
const NotFound = lazy(() => import('./pages/NotFound'));
// The admin dashboard is a separate bundle — public visitors never download it
const AdminApp = lazy(() => import('./admin/AdminApp'));

const Page = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div className="pattern-saffron relative min-h-screen pt-40"><PageLoader /></div>}>{children}</Suspense>
);

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Page><AdminApp /></Page>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<Page><About /></Page>} />
        <Route path="branches" element={<Page><Branches /></Page>} />
        <Route path="branches/:slug" element={<Page><BranchDetail /></Page>} />
        <Route path="menu" element={<Page><MenuPage /></Page>} />
        <Route path="gallery" element={<Page><Gallery /></Page>} />
        <Route path="founder" element={<Page><Founder /></Page>} />
        <Route path="contact" element={<Page><Contact /></Page>} />
        <Route path="reserve" element={<Page><Reserve /></Page>} />
        <Route path="privacy" element={<Page><Privacy /></Page>} />
        <Route path="terms" element={<Page><Terms /></Page>} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Route>
    </Routes>
  );
}
