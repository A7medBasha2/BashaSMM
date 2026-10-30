import React, { useState } from 'react';
import { X, Sliders, Database, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, closeSettingsModal, dbUrl, saveSettings } = useApp();
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('smm_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('smm_supabase_key') || ''
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isSettingsOpen) return null;

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestResult({ success: false, message: 'يرجى إدخال الرابط والمفتاح أولاً' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await saveSettings(supabaseUrl.trim(), supabaseKey.trim());
      if (res) {
        setTestResult({ success: true, message: 'تم الاتصال بنجاح بقاعدة البيانات وجدول bot_accounts!' });
      } else {
        setTestResult({ success: false, message: 'تعذر الاتصال، يرجى مراجعة الرابط والمفتاح.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'خطأ في الاتصال' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    localStorage.setItem('smm_supabase_url', supabaseUrl.trim());
    localStorage.setItem('smm_supabase_key', supabaseKey.trim());
    if (supabaseUrl.trim() && supabaseKey.trim()) {
      await saveSettings(supabaseUrl.trim(), supabaseKey.trim());
    }
    closeSettingsModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#13131A] border border-[#2A2A38] p-6 space-y-5 gold-glow relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#23232F] pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            ربط ومزامنة قاعدة بيانات Supabase الحقيقية
          </h3>
          <button
            onClick={closeSettingsModal}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            قم بإدخال بيانات مشروع Supabase الخاص بك لجلب جدول{' '}
            <code className="text-amber-400 font-mono bg-black/40 px-1 py-0.5 rounded">
              bot_accounts
            </code>{' '}
            و{' '}
            <code className="text-amber-400 font-mono bg-black/40 px-1 py-0.5 rounded">
              bot_tasks
            </code>{' '}
            الفعلية ومزامنتها فورياً:
          </p>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Supabase Project URL:
            </label>
            <input
              type="text"
              placeholder="https://xxxxxxxx.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Supabase Anon Key / Service Role Key:
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0E0E14] border border-[#23232F] text-[11px] text-slate-400 flex items-center justify-between">
            <span>اختبار الاتصال المباشر بالجداول:</span>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              <span>فحص الاتصال الآن</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#23232F]">
            <button
              type="button"
              onClick={closeSettingsModal}
              className="px-4 py-2 rounded-lg bg-[#181822] hover:bg-[#20202E] text-slate-300 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold cursor-pointer active:scale-95"
            >
              حفظ ومزامنة الحسابات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
