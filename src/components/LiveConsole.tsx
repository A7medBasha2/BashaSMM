import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, ArrowDownCircle, Check, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LiveConsole: React.FC = () => {
  const { logs, clearLogs } = useApp();
  const consoleBottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');

  useEffect(() => {
    if (autoScroll) {
      consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'all') return true;
    return log.type === filterLevel;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-300';
      case 'warning':
        return 'text-amber-300';
      case 'error':
        return 'text-rose-300';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="rounded-xl bg-[#09090E] border border-[#23232F] overflow-hidden flex flex-col h-[280px] font-mono">
      {/* Console Top Bar */}
      <div className="px-4 py-2.5 bg-[#101016] border-b border-[#23232F] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-400 text-xs">
            Live Console: خطوات المتصفح الحقيقي والمزامنة
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Level */}
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value as any)}
            className="bg-[#161622] border border-[#2A2A38] text-[10px] text-slate-300 rounded px-2 py-0.5 focus:outline-none"
          >
            <option value="all">كل السجلات</option>
            <option value="info">معلومات (Info)</option>
            <option value="success">نجاح (Success)</option>
            <option value="warning">تنبيهات (Warning)</option>
            <option value="error">أخطاء (Error)</option>
          </select>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              autoScroll
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-transparent text-slate-500 border-[#2A2A38]'
            }`}
            title="التمرير التلقائي لآخر سطر"
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span>متابعة حية</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearLogs}
            className="text-slate-400 hover:text-rose-400 text-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="مسح سجل الأحداث"
          >
            <Trash2 className="w-3 h-3" />
            <span className="text-[10px]">مسح</span>
          </button>
        </div>
      </div>

      {/* Logs Output Box */}
      <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar space-y-1.5 text-[11px] leading-relaxed text-slate-300">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 text-center py-10">
            لا توجد سجلات تطابق الفلتر المحدد حالياً.
          </div>
        ) : (
          filteredLogs.map(log => {
            const timeStr = new Date(log.time).toLocaleTimeString('ar-EG', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 hover:bg-white/[0.02] px-1 rounded transition-colors ${getLogColor(
                  log.type
                )}`}
              >
                <span className="text-slate-500 shrink-0 font-mono text-[10px]">[{timeStr}]</span>
                {getLogIcon(log.type)}
                <span className="break-all">{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={consoleBottomRef} />
      </div>
    </div>
  );
};
