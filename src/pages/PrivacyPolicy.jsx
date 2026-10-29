import React from 'react';
import { ShieldCheck, Cookie, Mail, Lock, CheckCircle2, Sliders, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { openCookiePreferences } from '../utils/cookieConsent';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans py-16 px-4 sm:px-6 lg:px-8 selection:bg-lime-400 selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Navigation back */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-lime-400 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO CATALOG</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="border-b border-neutral-800 pb-8 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-lime-400 uppercase font-bold">
              TRANSPARENCY & DATA PRIVACY NOTICE
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            PRIVACY & DATA GOVERNANCE
          </h1>
          <p className="text-xs sm:text-sm font-mono text-neutral-400">
            Effective Date: October 2026 &bull; VENM Studio &bull; Ahmedabad, Gujarat, India
          </p>
        </div>

        {/* Interactive Cookie Preference Banner inside page */}
        <div className="p-6 bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
              <Cookie className="w-4 h-4 text-lime-400" />
              <span>YOUR ACTIVE COOKIE & STORAGE PREFERENCES</span>
            </div>
            <p className="text-xs text-neutral-400">
              You can adjust or withdraw your consent for non-essential storage at any time.
            </p>
          </div>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono tracking-wider uppercase text-white font-bold flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-lime-400" />
            <span>MANAGE COOKIE PREFERENCES</span>
          </button>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">01 //</span>
              <span>OVERVIEW & PHILOSOPHY</span>
            </h2>
            <p>
              VENM ("we", "us", or "our") operates the VENM digital reference catalog and fashion showcase based in Ahmedabad, Gujarat.
              We are dedicated to safeguarding your personal data and respecting your privacy rights under applicable data protection frameworks,
              including the <strong>Digital Personal Data Protection Act (DPDP Act 2023, India)</strong> and global data privacy standards.
            </p>
            <p>
              Visitors can browse our entire catalog of references, collections, and lookbooks without registering an account.
              We adhere strictly to the principle of <em>data minimization</em>: we never collect unnecessary personal identifiers,
              we do not fingerprint devices, and we do not trade or sell your personal data.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">02 //</span>
              <span>INFORMATION WE COLLECT & WHY</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-xs font-mono uppercase text-lime-400 font-bold block">
                  A. EMAIL MARKETING SUBSCRIBERS
                </span>
                <p className="text-xs text-neutral-400">
                  When you affirmatively opt-in to promotional emails via our subscription popup or forms:
                </p>
                <ul className="text-xs text-neutral-300 list-disc list-inside space-y-1 font-mono">
                  <li>Email address</li>
                  <li>Timestamp of affirmative consent</li>
                  <li>Consent wording and source</li>
                  <li>Individual unsubscribe token</li>
                </ul>
                <p className="text-[11px] text-neutral-500 pt-1">
                  <strong>Purpose:</strong> To send you announcements about new collection drops, exclusive editorial releases, and bespoke services.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-xs font-mono uppercase text-lime-400 font-bold block">
                  B. INQUIRIES & BESPOKE REQUESTS
                </span>
                <p className="text-xs text-neutral-400">
                  When you voluntarily request bespoke garment sizing or consultation:
                </p>
                <ul className="text-xs text-neutral-300 list-disc list-inside space-y-1 font-mono">
                  <li>Client name & contact (WhatsApp/phone/email)</li>
                  <li>Selected garment reference & sizing notes</li>
                  <li>Inquiry specifications</li>
                </ul>
                <p className="text-[11px] text-neutral-500 pt-1">
                  <strong>Purpose:</strong> To coordinate bespoke appointments and garment customization assistance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">03 //</span>
              <span>COOKIE & LOCAL STORAGE PRACTICES</span>
            </h2>
            <p>
              We separate cookie preferences completely from marketing email subscription consent:
            </p>
            <div className="space-y-3 pt-2 text-xs font-mono">
              <div className="p-3 bg-neutral-950 border-l-2 border-l-lime-400 border border-neutral-800">
                <strong className="text-white block uppercase mb-1">1. Strictly Essential Storage</strong>
                <p className="text-neutral-400">
                  Required to remember your consent choices, navigate dynamic product collections, and maintain secure sessions.
                  Always active.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 border-l-2 border-l-neutral-700 border border-neutral-800">
                <strong className="text-white block uppercase mb-1">2. Performance & Analytics Storage (Optional)</strong>
                <p className="text-neutral-400">
                  Gathers non-identifying aggregated metrics on look engagement to help us improve website speed and layout.
                  Only active if you explicitly consent.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 border-l-2 border-l-neutral-700 border border-neutral-800">
                <strong className="text-white block uppercase mb-1">3. Marketing & Campaign Personalization (Optional)</strong>
                <p className="text-neutral-400">
                  Allows editorial and promotional content personalization across catalog visits.
                  Only active if you explicitly consent.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">04 //</span>
              <span>WITHDRAWAL OF CONSENT & UNSUBSCRIBING</span>
            </h2>
            <p>
              You maintain full authority over your data at all times:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-neutral-300">
              <li>
                <strong>Instant Unsubscribe:</strong> Every promotional email sent by VENM features an individual, one-click unsubscribe link in the footer. Clicking it immediately flags your email as unsubscribed and prevents future promotional dispatches.
              </li>
              <li>
                <strong>Web Unsubscribe Portal:</strong> You can directly visit our public <Link to="/unsubscribe" className="text-lime-400 underline">Unsubscribe Portal</Link> at any time to opt out.
              </li>
              <li>
                <strong>Cookie Consent Revocation:</strong> You can re-open your cookie preferences via the link in the site footer or the button above to withdraw analytics or marketing storage consent immediately.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">05 //</span>
              <span>DATA RETENTION, ACCESS & DELETION RIGHTS</span>
            </h2>
            <p>
              Under applicable Indian data protection laws and international standards, you have the right to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-white uppercase block mb-1">Right to Access</span>
                <p className="text-neutral-400">Request confirmation of whether your data is being processed and view stored details.</p>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-white uppercase block mb-1">Right to Correction</span>
                <p className="text-neutral-400">Request correction or updates to inaccurate contact information.</p>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-white uppercase block mb-1">Right to Erasure</span>
                <p className="text-neutral-400">Request complete erasure of your subscriber record, subject to regulatory retention obligations.</p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">06 //</span>
              <span>SECURITY & TECHNICAL MEASURES</span>
            </h2>
            <p>
              We implement industry-grade technical safeguards including encrypted HTTPS in transit, encrypted storage at rest,
              strict administrator role-based access control, sliding-window rate limiting on public forms, and server-side honeypot spam protection.
              Full email addresses are never recorded in public log files.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 border-t border-neutral-800 pt-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="text-lime-400 font-bold">07 //</span>
              <span>PRIVACY GRIEVANCE & CONTACT OFFICER</span>
            </h2>
            <p className="text-xs text-neutral-400">
              For any privacy inquiries, consent withdrawals, or data subject requests, please contact our privacy representative:
            </p>
            <div className="p-4 bg-neutral-950 border border-neutral-800 font-mono text-xs space-y-1 text-neutral-300">
              <p className="text-white font-bold">VENM PRIVACY & COMPLIANCE</p>
              <p>Email: <a href="mailto:venm1310@gmail.com" className="text-lime-400 underline">venm1310@gmail.com</a></p>
              <p>Location: Ahmedabad, Gujarat, India</p>
              <p>Grievance Response Time: Within 72 business hours</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

