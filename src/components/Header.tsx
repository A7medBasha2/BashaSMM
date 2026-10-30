import React from 'react';
import { Bot, UserPlus, Play, Pause, Forward, Sliders, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    isWorkerRunning,
    isProcessing,
    openAddAccountModal,
    toggleWorker,
    triggerImmediateRun,
    openSettingsModal
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#0E0E14]/90 backdrop-blur-md border-b border-[#23232F] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & System Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-xl shadow-lg shadow-amber-500/20">
            <Bot className="w-6 h-6 text-black stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Basha <span className="text-amber-400">SMM</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync Active
              </span>
              {isProcessing && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3 text-amber-400" />
                  يعمل الآن
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">محرك فيسبوك الحقيقي والمزامنة المستمرة للصور</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Add Real Account Button */}
          <button
            onClick={openAddAccountModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">إضافة حساب حقيقي</span>
            <span className="sm:hidden">حساب جديد</span>
          </button>

          {/* Toggle Continuous Worker Button */}
          <button
            onClick={toggleWorker}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              isWorkerRunning
                ? 'bg-[#181822] hover:bg-[#222230] text-slate-200 border-[#2A2A38]'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {isWorkerRunning ? (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>إيقاف الطابور</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-rose-400" />
                <span>تشغيل الطابور</span>
              </>
            )}
          </button>

          {/* Trigger Immediate Task Button */}
          <button
            onClick={triggerImmediateRun}
            disabled={isProcessing}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-[#181822] hover:bg-[#20202E] text-slate-200 border border-[#2A2A38] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            title="معالجة أول مهمة معلقة في الطابور فوراً"
          >
            <Forward className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">تنفيذ فوري</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={openSettingsModal}
            className="w-9 h-9 rounded-lg bg-[#13131A] hover:bg-[#1C1C26] border border-[#23232F] text-slate-400 hover:text-amber-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="إعدادات Supabase"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
