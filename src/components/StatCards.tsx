import React from 'react';
import { CheckCircle2, ShieldAlert, Ban, Hourglass, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StatCards: React.FC = () => {
  const { stats } = useApp();

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* 1. Active Accounts */}
      <div className="p-4 rounded-xl bg-[#13131A] border border-[#23232F] hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>الحسابات النشطة</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400">
          {stats.activeAccounts}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">جاهزة ومسجلة الدخول</p>
      </div>

      {/* 2. Checkpoint Accounts */}
      <div className="p-4 rounded-xl bg-[#13131A] border border-[#23232F] hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>شاشة تفتيش</span>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-400">
          {stats.checkpointAccounts}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">مجمدة مؤقتاً للحماية</p>
      </div>

      {/* 3. Banned Accounts */}
      <div className="p-4 rounded-xl bg-[#13131A] border border-[#23232F] hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>حسابات محظورة</span>
          <Ban className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-rose-400">
          {stats.bannedAccounts}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">مستبعدة من الطابور</p>
      </div>

      {/* 4. Pending Tasks */}
      <div className="p-4 rounded-xl bg-[#13131A] border border-[#23232F] hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>طابور الانتظار</span>
          <Hourglass className="w-4 h-4 text-amber-300" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-300">
          {stats.pendingTasks}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">تنتظر دورها بالمتصفح</p>
      </div>

      {/* 5. Completed Tasks */}
      <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-[#13131A] border border-[#23232F] hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>مهام مكتملة</span>
          <CheckCheck className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-blue-400">
          {stats.completedTasks}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">تمت وموثقة بالصور</p>
      </div>
    </div>
  );
};
