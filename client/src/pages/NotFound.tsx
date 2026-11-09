import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export default function NotFound() {
  return (
    <section className="pattern-saffron relative flex min-h-[80vh] items-center pt-24 text-white">
      <Seo title="Page not found" noindex />
      <div className="container-x flex flex-col items-center text-center">
        <img src="/logo.png" alt="" className="h-24 w-24 animate-float rounded-full shadow-lift ring-4 ring-white/50" />
        <p className="mt-6 font-display text-6xl font-bold text-white">404</p>
        <h1 className="mt-3 font-display text-3xl text-white">This page could not be found</h1>
        <p className="mt-3 max-w-md text-white/85">The page may have moved. Let’s get you back to something delicious.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-light">Go to Home</Link>
          <Link to="/menu" className="btn-outline-light">View Menu</Link>
        </div>
      </div>
    </section>
  );
}
