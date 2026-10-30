import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  RotateCw,
  Camera,
  Play,
  Pencil,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Clock
} from 'lucide-react';
import type { Account, AccountStatus } from '../types';
import { useApp } from '../context/AppContext';

export const AccountsList: React.FC = () => {
  const {
    accounts,
    openAddAccountModal,
    openEditAccountModal,
    openAddTaskModal,
    checkAccount,
    syncAvatar,
    deleteAccount
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.email && acc.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      acc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    const parts = (name || 'User').trim().split(/\s+/);
    let initials = parts[0] ? parts[0][0].toUpperCase() : 'U';
    if (parts.length > 1 && parts[1]) {
      initials += parts[1][0].toUpperCase();
    }
    return initials;
  };

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    await checkAccount(id);
    setCheckingId(null);
  };

  const handleSyncAvatar = async (id: string) => {
    setSyncingId(id);
    await syncAvatar(id);
    setSyncingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الحساب [${name}] نهائياً؟`)) {
      await deleteAccount(id);
    }
  };

  return (
    <div className="rounded-xl bg-[#13131A] border border-[#23232F] overflow-hidden flex flex-col h-[640px]">
      {/* Top Header */}
      <div className="p-4 border-b border-[#23232F] flex items-center justify-between bg-[#101017]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h2 className="font-bold text-sm text-white">الحسابات الفعلية (Real Accounts)</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 font-mono font-bold">
            {accounts.length}
          </span>
        </div>
        <button
          onClick={openAddAccountModal}
          className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة حساب</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 border-b border-[#1E1E2A] bg-[#0E0E14] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الإيميل أو المعرف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-[#14141E] border border-[#242434] text-xs text-slate-200 focus:border-amber-400 focus:outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#181824] text-slate-400 hover:text-white'
            }`}
          >
            الكل ({accounts.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'bg-[#181824] text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            نشط ({accounts.filter(a => a.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('checkpoint')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              statusFilter === 'checkpoint'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'bg-[#181824] text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            تفتيش ({accounts.filter(a => a.status === 'checkpoint').length})
          </button>
          <button
            onClick={() => setStatusFilter('banned')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              statusFilter === 'banned'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                : 'bg-[#181824] text-slate-400 hover:text-white'
            }`}
          >
            <Ban className="w-3 h-3 text-rose-400" />
            محظور ({accounts.filter(a => a.status === 'banned').length})
          </button>
        </div>
      </div>

      {/* Accounts List Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
            <p>لا توجد حسابات مطابقة للبحث أو الفلتر الحالي</p>
          </div>
        ) : (
          filteredAccounts.map(account => {
            const hasAvatarError = avatarErrors[account.id];
            const hasAvatar = Boolean(account.avatar_url && !hasAvatarError);
            const isChecking = checkingId === account.id;
            const isSyncing = syncingId === account.id;

            return (
              <div
                key={account.id}
                className="p-3 rounded-xl bg-[#0F0F15] border border-[#23232F] hover:border-amber-500/30 transition-all flex flex-col gap-2.5 group"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar & Basic Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {hasAvatar ? (
                        <img
                          src={account.avatar_url!}
                          alt={account.username}
                          onError={() => setAvatarErrors(prev => ({ ...prev, [account.id]: true }))}
                          className="w-11 h-11 rounded-xl object-cover border border-amber-500/30 bg-[#14120B]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2A2415] to-[#14120B] border border-amber-500/40 flex items-center justify-center font-bold font-mono text-amber-400 text-sm shadow-sm">
                          {getInitials(account.username)}
                        </div>
                      )}
                      {/* Status indicator dot */}
                      <span
                        className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-[#0F0F15] ${
                          account.status === 'active'
                            ? 'bg-emerald-400'
                            : account.status === 'checkpoint'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        title={account.status}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs text-white truncate max-w-[170px]" title={account.username}>
                          {account.username}
                        </h3>
                        {account.status === 'active' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0">
                            نشط
                          </span>
                        )}
                        {account.status === 'checkpoint' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium shrink-0">
                            تفتيش 2FA
                          </span>
                        )}
                        {account.status === 'banned' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium shrink-0">
                            محظور
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5" title={account.email || 'بدون إيميل'}>
                        {account.email || 'تسجيل دخول بالكوكيز'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                        <span>ID: {account.id.substring(0, 16)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(account.updated_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCheck(account.id)}
                      disabled={isChecking}
                      className="w-7 h-7 rounded-lg bg-[#181824] hover:bg-amber-500 hover:text-black text-slate-400 transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                      title="فحص نشاط الحساب بالمتصفح الآن"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleSyncAvatar(account.id)}
                      disabled={isSyncing}
                      className="w-7 h-7 rounded-lg bg-[#181824] hover:bg-amber-500 hover:text-black text-slate-400 transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                      title="مزامنة وتحديث صورة البروفايل الحقيقية"
                    >
                      <Camera className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => openAddTaskModal(account.id)}
                      className="w-7 h-7 rounded-lg bg-[#181824] hover:bg-emerald-500 hover:text-black text-slate-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      title="جدولة مهمة جديدة لهذا الحساب"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditAccountModal(account)}
                      className="w-7 h-7 rounded-lg bg-[#181824] hover:bg-blue-500 hover:text-white text-slate-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      title="تعديل بيانات الحساب"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id, account.username)}
                      className="w-7 h-7 rounded-lg bg-[#181824] hover:bg-rose-500 hover:text-white text-slate-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Error warning if account is on checkpoint or has last_error */}
                {account.last_error && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{account.last_error}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
