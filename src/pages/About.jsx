import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, Cpu, Feather, Sparkles } from 'lucide-react';
import { apiGetHomepageSections } from '../services/api';

const About = () => {
  const [aboutSec, setAboutSec] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAboutCMS() {
      try {
        const liveCMS = await apiGetHomepageSections();
        if (isMounted && Array.isArray(liveCMS)) {
          const found = liveCMS.find((s) => s.sectionKey === 'about_story');
          if (found) setAboutSec(found);
        }
      } catch (e) {}
    }
    loadAboutCMS();
    return () => { isMounted = false; };
  }, []);

  const content = aboutSec?.content || {};

  return (
    <div className="min-h-screen bg-white text-neutral-900 space-y-20 pb-24 font-sans">
      {/* Hero Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-neutral-300 text-neutral-800 text-xs font-mono tracking-widest uppercase">
            <Compass className="w-3.5 h-3.5" />
            <span>{content.badge || "VENM ARCHIVE & DESIGN STUDIO"}</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold tracking-widest text-neutral-900 uppercase leading-tight">
            {content.title || "THE MANIFESTO OF VENM"}
          </h1>

          <p className="text-sm sm:text-xl text-neutral-700 font-light tracking-wider leading-relaxed uppercase max-w-2xl">
            {content.subtitle || "CULTURE × EXPERIMENTATION × YOUTH CULTURE × GUJARATI HERITAGE"}
          </p>
        </div>
      </section>

      {/* Core Story */}
      {aboutSec?.enabled !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
                GEN-Z FASHION // GUJARAT ORIGINS
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-wider text-neutral-900 uppercase">
                {content.headline || "BORN IN AHMEDABAD. ENGINEERED FOR MIDNIGHT."}
              </h2>
              <div className="space-y-4 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed font-light">
                <p>
                  {content.paragraph1 || "VENM was founded with a singular conviction: traditional fashion should not remain frozen in history textbooks or restricted to standard wedding attire."}
                </p>
                <p>
                  {content.paragraph2 || "Rooted in Gujarat’s centuries-old textile mastery—from intricate bandhani tie-dyes and hand-carved block prints to reflective mirrorwork—VENM reinterprets these sacred cultural motifs through raw 14oz selvedge denim, 400GSM cotton loopback fleece, and tactical cybernetic silhouettes."}
                </p>
                <p>
                  {content.paragraph3 || "We do not create disposable fast-fashion. We build bespoke catalog pieces designed for confidence, individuality, and midnight Garba energy."}
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 relative aspect-[4/5] bg-white border border-neutral-200 overflow-hidden group">
              <img
                src={content.coverImage || "/assets/campaign/nas1.webp"}
                alt="VENM Craftsmanship"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-sm border border-neutral-200">
                <span className="text-[10px] font-mono text-neutral-600 tracking-widest uppercase block">
                  CRAFT STUDIO // AHMEDABAD
                </span>
                <p className="text-xs text-neutral-900 font-bold tracking-wider uppercase">
                  {content.caption || "HAND-EMBROIDERED MIRRORWORK & HEAVY DENIM INTEGRATION"}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4 Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-neutral-200 pb-6 space-y-2">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
            OUR FOUR FOUNDATIONAL PILLARS
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
            WHAT DEFINES VENM
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Compass,
              title: 'CULTURAL ETHOS',
              desc: 'Deep reverence for Gujarati textiles, Garba movement energy, and Kathiawadi folk patterns.'
            },
            {
              icon: Cpu,
              title: 'CYBER-ETHNO DESIGN',
              desc: 'Deconstructed suits, technical zip polo collars, and utility cargo pockets fused with traditional mirrorwork.'
            },
            {
              icon: Feather,
              title: 'BESPOKE QUALITY',
              desc: '14.5oz selvedge denim and 400GSM loopback cotton engineered to withstand years of midnight wear.'
            },
            {
              icon: Sparkles,
              title: 'YOUTH REBEL CULTURE',
              desc: 'Designed for Gen-Z tastemakers who refuse to choose between traditional roots and streetwear.'
            }
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="bg-white p-6 space-y-4 border border-neutral-200 hover:border-black transition-all">
                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold tracking-wider text-neutral-900 uppercase">
                  {pillar.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans font-light">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-neutral-50 p-10 sm:p-14 border border-neutral-200 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
            EXPLORE THE NAVRATRI EDIT
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto font-sans leading-relaxed">
            EXPERIENCE VENM'S SEASONAL CELEBRATION OF GUJARATI HERITAGE AND CYBER STREETWEAR.
          </p>

          <div className="pt-2">
            <Link
              to={content.ctaLink || "/collection/navratri"}
              className="inline-flex btn-venm-primary px-8 py-4 text-xs font-bold tracking-[0.18em] items-center gap-2 uppercase"
            >
              <span>{content.ctaText || "EXPLORE THE FESTIVE EDIT"}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
