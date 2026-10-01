import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';

const EditorialGrid = () => {
  return (
    <section className="py-20 bg-neutral-50 border-t border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
              EDITORIAL // VOL. 04
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-wider text-neutral-900 uppercase">
              THE FESTIVE EDITORIAL
            </h2>
          </div>
          <p className="text-xs text-neutral-600 max-w-md leading-relaxed font-sans font-light">
            AN EXPLORATION OF CYBER-ETHNO PROPORTIONS. HAND-EMBROIDERED MIRRORWORK FUSED WITH DECONSTRUCTED 400GSM HOODIES AND HIGH-DENSITY SELVEDGE DENIM.
          </p>
        </div>

        {/* Asymmetrical Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Main Editorial Image */}
          <div className="md:col-span-7 relative group overflow-hidden bg-white border border-neutral-200 aspect-[4/5] min-h-[480px]">
            <img
              src="/assets/campaign/nas1.webp"
              alt="VENM Editorial Look 01"
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_CAMPAIGN; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute bottom-8 left-8 right-8 space-y-2 text-white">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 text-lime-400 border border-lime-400/50 font-bold text-[9px] tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
                <span>LOOK 01 // DECONSTRUCTED KIMONO</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-wider uppercase">
                GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR
              </h3>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 flex flex-col gap-6 justify-between">
            <div className="relative group overflow-hidden bg-white border border-neutral-200 h-64">
              <img
                src="/assets/campaign/nas8.jpg"
                alt="VENM Editorial Look 02"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white space-y-1">
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-300">
                  LOOK 02 // OBSIDIAN SILK
                </span>
                <h4 className="text-lg font-bold tracking-wider uppercase">MIDNIGHT GARBA DRAPES</h4>
              </div>
            </div>

            {/* Manifesto Box */}
            <div className="bg-white p-8 border border-neutral-200 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
                  BRAND MANIFESTO
                </span>
                <blockquote className="text-lg font-extrabold tracking-wider text-neutral-900 uppercase leading-snug">
                  "WE DO NOT COPY THE PAST. WE REENGINEER IT FOR THE MIDNIGHT DANCE FLOOR."
                </blockquote>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500">VENM DESIGN STUDIO</span>
                <Link
                  to="/collection/navratri"
                  className="text-xs font-semibold tracking-widest text-neutral-900 hover:text-black flex items-center gap-1.5 transition-colors uppercase"
                >
                  <span>EXPLORE EDIT</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialGrid;
