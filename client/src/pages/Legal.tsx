import type { ReactNode } from 'react';
import { useSite } from '../lib/site';
import { Seo } from '../components/Seo';
import { PageHero } from '../components/ui';

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Seo title={title} />
      <PageHero eyebrow="Legal" title={title} />
      <section className="section pt-12">
        <div className="container-x max-w-3xl">
          <div className="card space-y-6 p-7 text-[0.95rem] leading-relaxed text-charcoal-600 sm:p-12 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
            {children}
            <p className="border-t border-ink-900/10 pt-6 text-xs text-charcoal-300">Last updated: {new Date().getFullYear()}.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactLine() {
  const { site } = useSite();
  const s = site?.settings;
  return (
    <p>
      For any questions, contact us{s?.phone ? ` on ${s.phone}` : ''}
      {s?.email ? ` or at ${s.email}` : ''} or through the Contact page.
    </p>
  );
}

export function Privacy() {
  const { site } = useSite();
  const brand = site?.settings.brandName || 'Hotel Shauryawada';
  return (
    <LegalPage title="Privacy Policy">
      <p>{brand} respects your privacy. This policy explains what information we collect through this website and how we use it.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Details you submit in our table enquiry or contact forms: name, phone number, email (optional), preferred branch, date, time, number of guests and your message.</li>
        <li>Basic technical data needed to run and protect the website, such as a one-way hashed form of your IP address used to prevent spam.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To respond to your enquiry and confirm your visit by phone or email.</li>
        <li>To improve our service and keep the website secure.</li>
      </ul>
      <p>We do not sell your personal information. We do not use advertising trackers on this website.</p>
      <h2>Retention and your rights</h2>
      <p>Enquiries are kept only as long as needed to serve you and for reasonable record-keeping. You may ask us to access, correct or delete your information at any time.</p>
      <h2>Third-party links</h2>
      <p>This website links to Google Maps, Instagram, YouTube and other services. Their own privacy policies apply when you use them.</p>
      <ContactLine />
    </LegalPage>
  );
}

export function Terms() {
  const { site } = useSite();
  const brand = site?.settings.brandName || 'Hotel Shauryawada';
  return (
    <LegalPage title="Terms & Conditions">
      <p>By using this website you agree to the following terms.</p>
      <h2>Table enquiries</h2>
      <p>Submitting a table enquiry does not guarantee a reservation. A table is confirmed only when our branch team contacts you to confirm it.</p>
      <h2>Menu, prices and availability</h2>
      <p>Menu items, prices, timings and services shown on this website are for information and may vary between branches or change without notice. Please confirm with the branch.</p>
      <h2>Content</h2>
      <p>All text, images and branding on this website belong to {brand} unless stated otherwise and may not be reused without permission.</p>
      <h2>Liability</h2>
      <p>We take care to keep information accurate but cannot guarantee that it is always complete or up to date.</p>
      <ContactLine />
    </LegalPage>
  );
}
