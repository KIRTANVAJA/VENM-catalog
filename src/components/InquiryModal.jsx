import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, CheckCircle2, ShieldCheck, Shirt, Sparkles, Lock, User } from 'lucide-react';
import { formatWhatsAppUrl, getSettings } from '../data/settings';
import { formatReferencePrice } from '../data/catalog';
import { BRAND_ASSETS } from '../config/assets';
import { apiTrackWhatsAppClick, apiCreateInquiry } from '../services/api';
import { useAuth } from '../context/AuthContext';

const InquiryModal = ({ product, selectedSize, isOpen, onClose }) => {
  const { currentUser, isAuthenticated, openLoginModal } = useAuth();
  const [requestType, setRequestType] = useState('I already have the garment');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    note: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        contact: prev.contact || currentUser.email || currentUser.phone || ''
      }));
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !product) return null;

  const activeSize = selectedSize || product.sizes?.[0] || 'Custom';
  const settings = getSettings();
  const estimatedPriceText = formatReferencePrice(product);
  const whatsappUrl = formatWhatsAppUrl(product, activeSize, requestType, currentUser);
  const referenceIdStr = product.id ? `REF ID: ${product.id}` : `REF ID: ${product.slug}`;

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    const clientEmail = currentUser?.email || (formData.contact?.includes('@') ? formData.contact : null);
    const clientPhone = currentUser?.phone || (!formData.contact?.includes('@') ? formData.contact : null);

    const payload = {
      userId: currentUser?.id || null,
      clientName: currentUser?.name || formData.name || 'Client',
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      clientContact: formData.contact || clientEmail || clientPhone || '',
      userMeta: JSON.stringify(currentUser || {}),
      productId: product?.id,
      productSlug: product?.slug,
      productName: product?.name,
      productImage: product?.images?.[0] || product?.image,
      productPrice: estimatedPriceText,
      collectionName: product?.collectionName,
      selectedSize: activeSize,
      requestType,
      note: formData.note
    };

    try {
      await apiCreateInquiry(payload);
    } catch (err) {
      console.warn('API inquiry submit failed:', err);
    }

    // Save to local storage for instant reactivity
    try {
      const storageKey = currentUser?.id ? `venm_inquiries_${currentUser.id}` : 'venm_guest_inquiries';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.unshift({
        ...payload,
        id: 'inq-' + Date.now(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(existing));
      window.dispatchEvent(new Event('venm-inquiries-updated'));
    } catch (e) {}
  };

  const handleWhatsAppClick = async () => {
    apiTrackWhatsAppClick(product.name, product.collectionName);

    // Record inquiry for user profile
    const payload = {
      userId: currentUser?.id || null,
      clientName: currentUser?.name || formData.name || 'Client',
      clientEmail: currentUser?.email || null,
      clientPhone: currentUser?.phone || null,
      clientContact: currentUser?.phone || currentUser?.email || formData.contact || 'WhatsApp Direct',
      userMeta: JSON.stringify(currentUser || {}),
      productId: product?.id,
      productSlug: product?.slug,
      productName: product?.name,
      productImage: product?.images?.[0] || product?.image,
      productPrice: estimatedPriceText,
      collectionName: product?.collectionName,
      selectedSize: activeSize,
      requestType: 'WhatsApp Direct Request',
      note: `Requested look on WhatsApp (${requestType})`
    };

    try {
      await apiCreateInquiry(payload);
      const storageKey = currentUser?.id ? `venm_inquiries_${currentUser.id}` : 'venm_guest_inquiries';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.unshift({
        ...payload,
        id: 'inq-' + Date.now(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(existing));
      window.dispatchEvent(new Event('venm-inquiries-updated'));
    } catch (e) {}
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
            FASHION REFERENCE CUSTOM REQUEST
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider text-neutral-900 uppercase">
            REQUEST THIS LOOK
          </h2>
        </div>

        {/* Product / Reference Snippet */}
        <div className="flex items-center gap-4 p-3.5 bg-neutral-50 border border-neutral-200">
          <img
            src={product.images?.[0] || product.image || BRAND_ASSETS.FALLBACK_PRODUCT}
            alt={product.name}
            className="w-14 h-18 object-cover bg-neutral-100 border border-neutral-200 flex-shrink-0"
            onError={(e) => { e.currentTarget.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
          />
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-bold text-neutral-900 tracking-wider uppercase">{product.name}</h4>
            <p className="text-[10px] font-mono text-neutral-500">{product.collectionName || 'VENM REFERENCE'}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-700 font-mono">
              <span className="font-bold text-black">{estimatedPriceText}</span>
              <span>•</span>
              <span className="text-neutral-500 text-[10px]">{referenceIdStr}</span>
            </div>
          </div>
        </div>

        {/* Garment Option Selection */}
        <div className="space-y-2 border-t border-neutral-200 pt-4">
          <label className="text-[10px] font-mono text-neutral-800 tracking-widest uppercase font-bold block">
            GARMENT OPTION // HOW WOULD YOU LIKE TO WORK WITH US?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRequestType('I already have the garment')}
              className={`p-3 text-left border transition-all text-xs font-mono flex items-start gap-2.5 ${
                requestType === 'I already have the garment'
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-black'
              }`}
            >
              <Shirt className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold uppercase text-[11px]">I HAVE MY GARMENT</span>
                <span className="text-[9px] opacity-80 leading-tight block pt-0.5">Send your piece to VENM to customize</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRequestType('I need VENM to source the garment')}
              className={`p-3 text-left border transition-all text-xs font-mono flex items-start gap-2.5 ${
                requestType === 'I need VENM to source the garment'
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-black'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold uppercase text-[11px]">VENM SOURCES PIECE</span>
                <span className="text-[9px] opacity-80 leading-tight block pt-0.5">We source base garment for you</span>
              </div>
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="py-8 px-4 text-center space-y-5 bg-neutral-50 border border-neutral-200 animate-fadeIn">
            <div className="w-14 h-14 bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6 text-lime-400" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold">
                CLIENT ACCESS REQUIRED
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900">
                SIGN IN REQUIRED TO INQUIRE
              </h3>
              <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                You can freely browse our reference catalog as a guest, but submitting bespoke inquiries and receiving custom styling estimates requires signing in.
              </p>
            </div>

            <div className="space-y-2 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openLoginModal('login', 'inquiry_required');
                }}
                className="w-full btn-venm-primary py-3.5 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 bg-lime-400 text-neutral-900 hover:bg-lime-300"
              >
                <User className="w-4 h-4" />
                <span>SIGN IN TO INQUIRE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openLoginModal('register', 'inquiry_required');
                }}
                className="w-full btn-venm-secondary py-2.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
              >
                <span>CREATE NEW CLIENT ACCOUNT</span>
              </button>
            </div>
          </div>
        ) : formSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-black mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-900 tracking-wider uppercase">REQUEST RECEIVED</h3>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                Thank you, {formData.name || currentUser?.name || 'Valued Client'}. Your inquiry has been saved to your account! Our styling team will review your request ({requestType}) and contact you.
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
                onClick={handleWhatsAppClick}
                className="w-full btn-venm-primary py-3.5 px-4 flex items-center justify-center gap-2.5 text-xs font-bold tracking-widest uppercase"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>REQUEST THIS LOOK ON WHATSAPP</span>
              </a>
              <p className="text-[10px] text-neutral-500 text-center font-mono tracking-wider">
                Directly connects to VENM Studio ({settings.whatsapp.number})
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-neutral-400">OR DIRECT REQUEST FORM</span>
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
                  className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none font-sans"
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
                  className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">CUSTOM REQUIREMENTS / SIZING NOTES</label>
                <textarea
                  rows="3"
                  placeholder="Tell us about your garment, custom embroidery ideas, or sizing details..."
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
                <span>SUBMIT CUSTOM REQUEST</span>
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-200">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
              <span>INQUIRY IS SAVED TO YOUR VENM CLIENT ACCOUNT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
