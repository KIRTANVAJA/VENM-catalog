import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiLogin } from '../services/api';

const AdminPasskeyModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [passkey, setPasskey] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setError(false);
        setSuccess(false);
        setPasskey(['', '', '', '']);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleDigitChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newPasskey = [...passkey];
    newPasskey[index] = value;
    setPasskey(newPasskey);
    setError(false);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    const fullPin = newPasskey.join('');
    if (fullPin.length === 4) {
      verifyPasskey(fullPin);
    }
  };

  const handleKeyDownInput = (index, e) => {
    if (e.key === 'Backspace' && !passkey[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyPasskey = async (pin) => {
    if (pin === '1310') {
      setSuccess(true);
      setError(false);
      try {
        await apiLogin('venm1310@gmail.com', 'password123');
      } catch (err) {
        console.warn('[PASSKEY] Auto-login error:', err);
      }
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setPasskey(['', '', '', '']);
        navigate('/admin/dashboard');
      }, 500);
    } else {
      setError(true);
      setSuccess(false);
      setTimeout(() => {
        setPasskey(['', '', '', '']);
        inputRefs[0].current?.focus();
      }, 700);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans select-none">
      <div
        className={`relative w-full max-w-sm bg-white p-6 sm:p-8 border shadow-2xl space-y-6 ${
          error ? 'border-red-500 animate-shake' : 'border-neutral-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
              STUDIO SECURITY // ACCESS
            </span>
            <h2 className="text-xl font-extrabold tracking-wider text-neutral-900 uppercase">
              ENTER ADMIN PASSKEY
            </h2>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            PRESS 4-DIGIT KEY TO ACCESS VENM ADMIN PANEL
          </p>
        </div>

        <div className="flex justify-center items-center gap-3 py-2">
          {passkey.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              maxLength="1"
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDownInput(idx, e)}
              className={`w-12 h-14 text-center font-mono text-xl font-black bg-neutral-50 border text-neutral-900 outline-none transition-all ${
                error
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : success
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                  : digit
                  ? 'border-neutral-900 text-black'
                  : 'border-neutral-300 focus:border-neutral-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-mono text-center flex items-center justify-center gap-1.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>INVALID PASSKEY — ACCESS DENIED</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono text-center flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>ACCESS GRANTED — REDIRECTING...</span>
          </div>
        )}

        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>SHORTCUT: CTRL + SHIFT + A</span>
          <span className="text-neutral-900 font-bold">PASSKEY: 1310</span>
        </div>
      </div>
    </div>
  );
};

export default AdminPasskeyModal;
