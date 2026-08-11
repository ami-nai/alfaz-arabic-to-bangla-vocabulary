import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle, Sparkles, BookOpen, Database } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'গুগল দিয়ে প্রবেশ করতে সমস্যা হয়েছে');
    } finally {
      setGoogleLoading(false);
    }
  };

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
        }
      } else {
        const res = await signUp(email.trim(), password, name.trim());
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(res.message || 'অ্যাকাউন্ট তৈরি সফল হয়েছে!');
        }
      }
    } catch (err: any) {
      setError(err.message || 'একটি সমস্যা দেখা দিয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-bangla">
      <div className="max-w-md w-full space-y-6">
        
        {/* Branding header above card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#2C3E2E] text-amber-300 rounded-2xl shadow-lg mb-2">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E2E]">
            আরবি-বাংলা শব্দভাণ্ডার
          </h1>
          <p className="text-sm text-slate-600 max-w-xs mx-auto">
            শব্দভাণ্ডার ও আপনার ব্যক্তিগত শেখার অগ্রগতি দেখতে অনুগ্রহ করে লগইন করুন।
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#e6dec3]">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#2C3E2E] via-[#3d543f] to-[#2C3E2E] text-[#f4efe6] px-6 py-5">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#d1c2a5] mb-1">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>ব্যবহারকারী অ্যাকাউন্ট</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {mode === 'signin' ? 'লগইন করুন (Sign In)' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
            </h2>
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
                  ? 'bg-white text-[#2C3E2E] shadow-xs'
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
                  ? 'bg-white text-[#2C3E2E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-[#2C3E2E]" />
              <span>রেজিস্টার (Sign Up)</span>
            </button>
          </div>

          {/* Form */}
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
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 bg-[#2C3E2E] hover:bg-[#3d543f] text-[#f4efe6] font-semibold rounded-lg text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{mode === 'signin' ? 'প্রবেশ করুন (Sign In)' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">
                অথবা (OR)
              </span>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm shadow-2xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>গুগল দিয়ে প্রবেশ করুন (Continue with Google)</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};
