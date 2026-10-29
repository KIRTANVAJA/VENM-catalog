import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowLeft, MailX, Shield } from 'lucide-react';
import { apiGetUnsubscribeInfo, apiUnsubscribe } from '../services/api';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [manualEmail, setManualEmail] = useState('');
  const [reason, setReason] = useState('NO_LONGER_INTERESTED');
  const [isAlreadyUnsubscribed, setIsAlreadyUnsubscribed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      apiGetUnsubscribeInfo(token)
        .then((data) => {
          setMaskedEmail(data.maskedEmail);
          if (data.status === 'UNSUBSCRIBED') {
            setIsAlreadyUnsubscribed(true);
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || 'The unsubscribe link is invalid or expired. You can enter your email manually below.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token]);

  const handleConfirmUnsubscribe = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = token ? { token, reason } : { email: manualEmail.trim(), reason };
      const response = await apiUnsubscribe(payload);
      setIsSuccess(true);
      if (response.maskedEmail) setMaskedEmail(response.maskedEmail);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to process unsubscribe request. Please verify your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans py-20 px-4 sm:px-6 selection:bg-lime-400 selection:text-black flex items-center justify-center">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 p-8 shadow-2xl space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO VENM</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="border-b border-neutral-800 pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <MailX className="w-5 h-5 text-lime-400" />
            <span className="text-[10px] font-mono tracking-[0.25em] text-lime-400 uppercase font-bold">
              SUBSCRIPTION CENTER
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-wide">
            EMAIL OPT-OUT
          </h1>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-neutral-400">
            VERIFYING SUBSCRIPTION DETAILS...
          </div>
        ) : isSuccess ? (
          <div className="py-6 space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 bg-lime-400/20 text-lime-400 border border-lime-400/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              YOU HAVE BEEN UNSUBSCRIBED
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              {maskedEmail ? `Updates for ${maskedEmail} have been halted. ` : ''}
              You will no longer receive promotional emails or drop notifications from VENM.
            </p>
            <div className="pt-4 border-t border-neutral-900">
              <Link
                to="/"
                className="inline-block px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono uppercase text-white font-bold"
              >
                RETURN TO CATALOG
              </Link>
            </div>
          </div>
        ) : isAlreadyUnsubscribed ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              ALREADY UNSUBSCRIBED
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              This email address ({maskedEmail || 'address'}) is already unsubscribed from our marketing list. No further emails will be sent.
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-block px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono uppercase text-white font-bold"
              >
                BACK TO CATALOG
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmUnsubscribe} className="space-y-4">
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              {token && maskedEmail ? (
                <>
                  Confirm opt-out for <strong className="text-white font-mono">{maskedEmail}</strong>.
                  You can opt back in at any time on the VENM catalog.
                </>
              ) : (
                'Enter your email address to unsubscribe from promotional emails and new collection drop announcements.'
              )}
            </p>

            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!token && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                  YOUR EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-lime-400 font-sans"
                />
              </div>
            )}

            {/* Optional Reason Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                REASON (OPTIONAL)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400 font-sans"
              >
                <option value="NO_LONGER_INTERESTED">I no longer wish to receive updates</option>
                <option value="TOO_FREQUENT">Emails are too frequent</option>
                <option value="DID_NOT_OPT_IN">I did not mean to subscribe</option>
                <option value="OTHER">Other reason</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isSubmitting ? 'PROCESSING...' : 'CONFIRM UNSUBSCRIBE'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-neutral-900 text-[10px] font-mono text-neutral-600 text-center">
          VENM STUDIO &bull; AHMEDABAD &bull; PRIVACY-FIRST FASHION
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;

