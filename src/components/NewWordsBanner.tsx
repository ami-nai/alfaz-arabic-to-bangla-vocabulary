import React from 'react';
import { Sparkles, DownloadCloud, X, BellRing } from 'lucide-react';

interface NewWordsBannerProps {
  newCount: number;
  message?: string;
  onSync: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export const NewWordsBanner: React.FC<NewWordsBannerProps> = ({
  newCount,
  message,
  onSync,
  onDismiss,
  isLoading = false,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#2C3E2E] via-[#3d543f] to-[#2C3E2E] text-[#f4efe6] p-4 rounded-2xl shadow-lg border border-[#e6dec3] font-bangla my-4 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* Background Decorative Pattern */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left Info Icon & Text */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-xl shrink-0 mt-0.5 sm:mt-0 border border-amber-400/30">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                নতুন শব্দ আপডেট
              </span>
              {newCount > 0 && (
                <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  +{newCount} টি নতুন শব্দ
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {message || 'ডাটাবেসে নতুন শব্দ যোগ করা হয়েছে!'}
            </h3>
            <p className="text-xs text-[#d1c2a5] mt-0.5 leading-relaxed">
              আপনার শব্দভাণ্ডার আপডেট করতে নিচের বাটনে ক্লিক করুন। আপনার মেমোরাইজড স্ট্যাটাস সংরক্ষিত থাকবে।
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={onSync}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <DownloadCloud className="w-4 h-4 shrink-0" />
                <span>নতুন শব্দ লোড করুন</span>
              </>
            )}
          </button>

          <button
            onClick={onDismiss}
            className="p-2 text-[#d1c2a5] hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            title="সাময়িকভাবে লুকান"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
