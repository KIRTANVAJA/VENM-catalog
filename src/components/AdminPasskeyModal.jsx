import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Mail, Eye, EyeOff, X, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiLogin } from '../services/api';

const AdminPasskeyModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('passkey'); // 'passkey' | 'credentials'
  
  // Passkey state
  const [passkey, setPasskey] = useState(['', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  
  // Email & Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setPasskey(['', '', '', '']);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setSuccess(false);
    setLoading(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle modal on Ctrl+Shift+A or Cmd+Shift+A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) resetForm();
          return !prev;
        });
      }

      // Close modal on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccess(false);
      if (activeTab === 'passkey') {
        setTimeout(() => {
          inputRefs[0].current?.focus();
        }, 100);
      }
    }
  }, [isOpen, activeTab]);

  const handleDigitChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newPasskey = [...passkey];
    newPasskey[index] = value;
    setPasskey(newPasskey);
    setErrorMsg(null);

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
    setLoading(true);
    setErrorMsg(null);

    if (pin === '1310') {
      try {
        const res = await apiLogin('venm1310@gmail.com', 'password123');
        if (res?.user && res.user.role !== 'ADMIN') {
          setErrorMsg('ACCESS DENIED: ADMIN PRIVILEGES REQUIRED');
          setLoading(false);
          return;
        }
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          resetForm();
          navigate('/admin/dashboard');
        }, 400);
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || 'AUTHENTICATION FAILED');
        setTimeout(() => {
          setPasskey(['', '', '', '']);
          inputRefs[0].current?.focus();
        }, 700);
      }
    } else {
      setLoading(false);
      setErrorMsg('INVALID PASSKEY — ACCESS DENIED');
      setTimeout(() => {
        setPasskey(['', '', '', '']);
        inputRefs[0].current?.focus();
      }, 700);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('PLEASE ENTER BOTH ADMIN EMAIL AND PASSWORD');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiLogin(email.trim(), password);
      if (res?.user && res.user.role !== 'ADMIN') {
        setErrorMsg('ACCESS DENIED: ACCOUNT DOES NOT HAVE ADMIN PRIVILEGES');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
        navigate('/admin/dashboard');
      }, 400);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'INVALID ADMIN CREDENTIALS');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans select-none">
      <div
        className={`relative w-full max-w-sm bg-white p-6 sm:p-8 border shadow-2xl space-y-6 ${
          errorMsg ? 'border-red-500 animate-shake' : 'border-neutral-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-lime-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
              STUDIO SECURITY // ACCESS
            </span>
            <h2 className="text-xl font-extrabold tracking-wider text-neutral-900 uppercase">
              ADMIN CONTROL PANEL
            </h2>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            AUTHORIZED STUDIO PERSONNEL ONLY
          </p>
        </div>

        {/* Tab Switcher: Passkey vs Email & Password */}
        <div className="flex border border-neutral-200 p-0.5 bg-neutral-100 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('passkey');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'passkey'
                ? 'bg-neutral-900 text-white shadow'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PASSKEY</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-neutral-900 text-white shadow'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>EMAIL & PASSWORD</span>
          </button>
        </div>

        {/* TAB 1: PASSKEY MODE */}
        {activeTab === 'passkey' && (
          <div className="space-y-4">
            <p className="text-[11px] font-mono text-center text-neutral-500">
              ENTER 4-DIGIT STUDIO PIN
            </p>
            <div className="flex justify-center items-center gap-3 py-1">
              {passkey.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="password"
                  maxLength="1"
                  disabled={loading || success}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDownInput(idx, e)}
                  className={`w-12 h-14 text-center font-mono text-xl font-black bg-neutral-50 border text-neutral-900 outline-none transition-all ${
                    errorMsg
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
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD MODE */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3 font-mono">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                ADMIN EMAIL
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@venm.com"
                  disabled={loading || success}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-300 focus:border-black outline-none font-sans"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading || success}
                  required
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-neutral-50 border border-neutral-300 focus:border-black outline-none font-sans"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-3 text-neutral-400 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full btn-venm-primary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN AS ADMIN'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-mono text-center flex items-center justify-center gap-1.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono text-center flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>ACCESS GRANTED — REDIRECTING...</span>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>SHORTCUT: CTRL + SHIFT + A</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};

export default AdminPasskeyModal;
