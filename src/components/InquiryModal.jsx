import React, { useState } from 'react';
import { X, MessageCircle, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatWhatsAppUrl, getSettings } from '../data/settings';
import { BRAND_ASSETS } from '../config/assets';

const InquiryModal = ({ product, selectedSize, isOpen, onClose }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    note: ''
  });

  if (!isOpen || !product) return null;

  const activeSize = selectedSize || product.sizes?.[0] || 'M';
  const settings = getSettings();
  const whatsappUrl = formatWhatsAppUrl(product, activeSize);

  const handleSubmitForm = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div
        className="relative w-full max-w-lg bg-white p-6 sm:p-8 border border-neutral-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
            BESPOKE CATALOG INQUIRY
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider text-neutral-900 uppercase">
            INQUIRE ABOUT THIS PIECE
          </h2>
        </div>

        {/* Product Snippet */}
        <div className="flex items-center gap-4 p-3 bg-neutral-50 border border-neutral-200">
          <img
            src={product.images?.[0] || BRAND_ASSETS.FALLBACK_PRODUCT}
            alt={product.name}
            className="w-14 h-18 object-cover bg-neutral-100 border border-neutral-200"
            onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
          />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-neutral-900 tracking-wider uppercase">{product.name}</h4>
            <p className="text-[10px] font-mono text-neutral-500">{product.collectionName}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span>SELECTED SIZE: <strong className="text-neutral-900">{activeSize}</strong></span>
              <span>•</span>
              <span className="text-neutral-700 text-[10px] font-mono">{product.availability}</span>
            </div>
          </div>
        </div>

        {formSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-black mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-900 tracking-wider uppercase">INQUIRY RECEIVED</h3>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                Thank you, {formData.name || 'Valued Client'}. Our styling team will review your inquiry and reach out via {formData.contact}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-venm-primary px-6 py-2.5 text-xs font-semibold tracking-widest uppercase"
            >
              DONE
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Primary Action: Direct WhatsApp */}
            <div className="space-y-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-venm-primary py-3.5 px-4 flex items-center justify-center gap-2.5 text-xs font-bold tracking-widest uppercase"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>{settings.whatsapp.buttonText || 'INQUIRE VIA WHATSAPP (INSTANT)'}</span>
              </a>
              <p className="text-[10px] text-neutral-500 text-center font-mono tracking-wider">
                Directly connects to VENM Studio ({settings.whatsapp.number})
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-neutral-400">OR EMAIL INQUIRY</span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>

            {/* Quick Web Inquiry Form */}
            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">YOUR NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">EMAIL OR PHONE NUMBER</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210 or name@domain.com"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">BESPOKE REQUESTS / SIZING</label>
                <textarea
                  rows="3"
                  placeholder="Mention custom sizing preferences or delivery date requirement..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-venm-secondary py-3 text-xs font-semibold tracking-widest flex items-center justify-center gap-2 uppercase"
              >
                <Send className="w-4 h-4" />
                <span>SUBMIT INQUIRY REQUEST</span>
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-200">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
              <span>VENM GUARANTEES CONFIDENTIAL CLIENT PRIVACY</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
