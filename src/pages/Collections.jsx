import React, { useState, useEffect } from 'react';
import { getAllCollections } from '../data/catalog';
import { apiGetCollections } from '../services/api';
import CollectionCard from '../components/CollectionCard';
import { Layers } from 'lucide-react';

const Collections = () => {
  const [filter, setFilter] = useState('all');
  const [collections, setCollections] = useState(() => getAllCollections());

  useEffect(() => {
    let isMounted = true;
    async function loadCollections() {
      try {
        const live = await apiGetCollections();
        if (isMounted && live && live.length > 0) {
          setCollections(live);
        }
      } catch (err) {
        console.warn('[COLLECTIONS] Failed to fetch live collections:', err.message);
      }
    }
    loadCollections();
    return () => { isMounted = false; };
  }, []);

  const filteredCollections = collections.filter((c) => {
    const isActive = c.isActive !== undefined ? c.isActive : c.status === 'ACTIVE';
    if (filter === 'active') return isActive;
    if (filter === 'upcoming') return !isActive;
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-neutral-900 space-y-12 pb-24 font-sans">
      {/* Page Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-300 text-neutral-800 text-xs font-mono tracking-widest uppercase">
            <Layers className="w-3.5 h-3.5" />
            <span>VENM ARCHIVE & EDITS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-widest text-neutral-900 uppercase">
            ALL COLLECTIONS
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-2xl leading-relaxed">
            DISCOVER VENM'S SEASONAL CAMPAIGNS, PERMANENT CORE EDITS, AND UPCOMING CAPSULE RELEASES. EACH COLLECTION REFLECTS OUR GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR.
          </p>

          {/* Filter Tabs */}
          <div className="pt-4 flex flex-wrap gap-2.5">
            {[
              { id: 'all', label: 'ALL COLLECTIONS' },
              { id: 'active', label: 'ACTIVE EDITS' },
              { id: 'upcoming', label: 'COMING SOON' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all border ${
                  filter === tab.id
                    ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:text-black hover:border-neutral-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Collections;
