import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  ThumbsUp,
  MessageSquare,
  UserCheck,
  Share2,
  ExternalLink,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hourglass
} from 'lucide-react';
import type { Task, TaskType, TaskStatus } from '../types';
import { useApp } from '../context/AppContext';

export const TaskQueue: React.FC = () => {
  const { tasks, accounts, openAddTaskModal, openProofModal } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');

  const filteredTasks = tasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchType = typeFilter === 'all' || t.task_type === typeFilter;
    return matchStatus && matchType;
  });

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'like':
        return <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'extract_profile':
        return <UserCheck className="w-3.5 h-3.5 text-amber-400" />;
      case 'share':
        return <Share2 className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTaskLabel = (type: TaskType) => {
    switch (type) {
      case 'like':
        return 'إعجاب (Like)';
      case 'comment':
        return 'تعليق (Comment)';
      case 'extract_profile':
        return 'تحديث بروفايل';
      case 'share':
        return 'مشاركة (Share)';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            <Hourglass className="w-3 h-3 text-amber-400" />
            بالانتظار
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium animate-pulse">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            جاري التنفيذ
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            مكتملة
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            فشلت
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-[#13131A] border border-[#23232F] overflow-hidden flex flex-col h-[340px]">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#23232F] flex items-center justify-between bg-[#101017]">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-amber-400" />
          <h2 className="font-bold text-sm text-white">طابور المهام المؤتمتة (Task Queue)</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 font-mono font-bold">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => openAddTaskModal()}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-[#1E1E2A] bg-[#0E0E14] flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar text-[11px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-0.5 rounded ${
              statusFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2 py-0.5 rounded ${
              statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            بالانتظار
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2 py-0.5 rounded ${
              statusFilter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            المكتملة
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span className="hidden sm:inline">النوع:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-[#14141E] border border-[#23232F] rounded px-2 py-0.5 text-slate-200 text-[11px] focus:outline-none focus:border-amber-400"
          >
            <option value="all">جميع الأنواع</option>
            <option value="like">إعجاب</option>
            <option value="comment">تعليق</option>
            <option value="extract_profile">تحديث بروفايل</option>
            <option value="share">مشاركة</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-right text-xs">
          <thead className="sticky top-0 bg-[#0E0E14] text-slate-400 border-b border-[#23232F] z-10">
            <tr>
              <th className="p-2.5 font-semibold">المعرف</th>
              <th className="p-2.5 font-semibold">الحساب المنفذ</th>
              <th className="p-2.5 font-semibold">نوع العملية</th>
              <th className="p-2.5 font-semibold">الرابط المستهدف</th>
              <th className="p-2.5 font-semibold">الحالة</th>
              <th className="p-2.5 font-semibold text-center">إثبات التنفيذ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#23232F]">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  لا توجد مهام في الطابور حالياً
                </td>
              </tr>
            ) : (
              filteredTasks.map(task => {
                const assignedAccount =
                  task.bot_accounts || accounts.find(a => a.id === task.account_id);

                return (
                  <tr key={task.id} className="hover:bg-[#181822]/60 transition-colors">
                    {/* Task ID */}
                    <td className="p-2.5 font-mono text-slate-400 text-[11px]">
                      #{task.id}
                    </td>

                    {/* Account */}
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        {assignedAccount?.avatar_url ? (
                          <img
                            src={assignedAccount.avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-amber-500/20"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[9px] flex items-center justify-center">
                            {assignedAccount?.username?.[0] || 'U'}
                          </div>
                        )}
                        <span className="font-medium text-slate-200 truncate max-w-[120px]" title={assignedAccount?.username}>
                          {assignedAccount?.username || 'حساب محذوف'}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        {getTaskIcon(task.task_type)}
                        <span>{getTaskLabel(task.task_type)}</span>
                      </div>
                    </td>

                    {/* Target URL */}
                    <td className="p-2.5 max-w-[180px]">
                      <div className="flex items-center gap-1 truncate text-slate-400 font-mono text-[11px]">
                        <span className="truncate" title={task.target_url}>
                          {task.target_url}
                        </span>
                        <a
                          href={task.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:text-amber-300 shrink-0"
                          title="فتح الرابط"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {task.payload?.comment && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          "{String(task.payload.comment)}"
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-2.5">
                      {getStatusBadge(task.status)}
                    </td>

                    {/* Proof */}
                    <td className="p-2.5 text-center">
                      {task.proof_url ? (
                        <button
                          onClick={() => openProofModal(task.proof_url!)}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                          title="عرض لقطة الشاشة الحقيقية لإثبات التنفيذ"
                        >
                          <Camera className="w-3 h-3" />
                          <span>عرض الإثبات</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
