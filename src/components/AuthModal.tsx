import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, X, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle, Sparkles, Database } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('ইমেইল এবং পাসওয়ার্ড আবশ্যক');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('সফলভাবে লগইন হয়েছে!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const res = await signUp(email.trim(), password, name.trim());
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(res.message || 'অ্যাকাউন্ট তৈরি সফল হয়েছে!');
          if (!res.message?.includes('ইমেইল')) {
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'একটি সমস্যা দেখা দিয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#e6dec3] font-bangla transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-[#2C3E2E] via-[#3d543f] to-[#2C3E2E] text-[#f4efe6] px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#d1c2a5] hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#d1c2a5] mb-1">
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>ব্যক্তিগত অ্যাকাউন্ট</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {mode === 'signin' ? 'একাউন্টে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </h2>
          <p className="text-xs text-[#d1c2a5] mt-1">
            আপনার নিজস্ব মেমোরাইজড শব্দের তালিকা ও অগ্রগতি ক্লাউডে সংরক্ষণ করুন
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'signin'
                ? 'bg-white text-[#2C3E2E] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 text-[#2C3E2E]" />
            <span>লগইন (Login)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-white text-[#2C3E2E] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#2C3E2E]" />
            <span>রেজিস্টার (Sign Up)</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {!isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>সার্ভার সংযোগ পরীক্ষা করুন:</strong> অ্যাকাউন্ট সার্ভিস কানেকশন সেটিং চেক করুন।
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার নাম (Display Name)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: আব্দুল্লাহ"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2C3E2E] focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইমেইল ঠিকানা (Email Address) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2C3E2E] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পাসওয়ার্ড (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2C3E2E] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#2C3E2E] hover:bg-[#3d543f] text-[#f4efe6] font-semibold rounded-lg text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{mode === 'signin' ? 'প্রবেশ করুন (Sign In)' : 'অ্যাকাউন্ট নিশ্চিত করুন'}</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              গেস্ট/অনলাইন ছাড়া সরাসরি পড়ুন (Continue as Guest)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
