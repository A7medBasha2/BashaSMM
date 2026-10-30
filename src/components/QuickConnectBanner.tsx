import React from 'react';
import { Camera, RefreshCw, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const QuickConnectBanner: React.FC = () => {
  const { dbConnected, dbUrl, syncAllAvatars, refreshAll, loading } = useApp();

  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#13131A] to-[#181824] border border-[#2A2A38] flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dbConnected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
        <div>
          <span className="font-bold text-white ml-2">المزامنة الحية المستمرة:</span>
          <span className="text-emerald-400 font-semibold font-mono">
            مفعلة لايف (Auto Avatar & Status Sync)
          </span>
          <span className="mx-2 text-slate-500">|</span>
          <span className="text-slate-400 inline-flex items-center gap-1.5 font-mono">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            {dbConnected ? `متصل بـ Supabase (${dbUrl || 'نشط'})` : 'وضع التخزين السحابي المحلي المحمي'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={syncAllAvatars}
          className="px-3 py-1.5 rounded-lg bg-[#20202E] hover:bg-[#28283A] text-amber-400 border border-amber-500/20 transition-all flex items-center gap-1.5 font-medium cursor-pointer active:scale-95"
          title="فحص ومزامنة صور جميع الحسابات من فيسبوك"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>مزامنة صور الحسابات الآن</span>
        </button>

        <button
          onClick={refreshAll}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#181822] hover:bg-[#20202E] text-slate-300 border border-[#2A2A38] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>
    </div>
  );
};
