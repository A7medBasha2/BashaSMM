import React, { useState, useEffect } from 'react';
import { X, Pencil, User, Mail, KeyRound, Cookie, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AccountStatus } from '../../types';

export const EditAccountModal: React.FC = () => {
  const { isEditAccountOpen, closeEditAccountModal, editingAccount, updateAccount } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cookies, setCookies] = useState('');
  const [status, setStatus] = useState<AccountStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setUsername(editingAccount.username || '');
      setEmail(editingAccount.email || '');
      setPassword('');
      setCookies('');
      setStatus(editingAccount.status || 'active');
    }
  }, [editingAccount]);

  if (!isEditAccountOpen || !editingAccount) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    const success = await updateAccount(editingAccount.id, {
      username: username.trim(),
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      cookies: cookies.trim() || undefined,
      status
    });
    setIsSubmitting(false);

    if (success) {
      closeEditAccountModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#13131A] border border-[#2A2A38] p-6 space-y-5 gold-glow relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#23232F] pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-400" />
            تعديل بيانات الحساب
          </h3>
          <button
            onClick={closeEditAccountModal}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              اسم الحساب (Username):
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              البريد الإلكتروني / رقم الدخول:
            </label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              كلمة المرور (اتركها فارغة إن لم ترغب بتغييرها):
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cookie className="w-3.5 h-3.5 text-amber-400" />
                تحديث كوكيز الجلسة:
              </span>
              <span className="text-[10px] text-amber-400 font-normal">
                فك تجميد الحساب وإلغاء Checkpoint
              </span>
            </label>
            <textarea
              rows={2}
              placeholder="c_user=1000...; xs=... لتجاوز الفحص الأمني"
              value={cookies}
              onChange={e => setCookies(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              حالة الحساب في النظام:
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as AccountStatus)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="active">نشط (Active) - جاهز للعمل</option>
              <option value="checkpoint">تحت التحقق (Checkpoint) - مجمد مؤقتاً</option>
              <option value="banned">محظور (Banned) - متوقف نهائياً</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#23232F]">
            <button
              type="button"
              onClick={closeEditAccountModal}
              className="px-4 py-2 rounded-lg bg-[#181822] hover:bg-[#20202E] text-slate-300 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
