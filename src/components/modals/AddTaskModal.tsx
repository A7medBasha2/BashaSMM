import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Link as LinkIcon, MessageSquare, User, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { TaskType } from '../../types';

export const AddTaskModal: React.FC = () => {
  const { isAddTaskOpen, closeAddTaskModal, accounts, selectedAccountForTask, createTask } = useApp();
  const [accountId, setAccountId] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('like');
  const [targetUrl, setTargetUrl] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedAccountForTask) {
      setAccountId(selectedAccountForTask);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [selectedAccountForTask, accounts, accountId]);

  if (!isAddTaskOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim() || !accountId) return;

    setIsSubmitting(true);
    const success = await createTask({
      account_id: accountId,
      task_type: taskType,
      target_url: targetUrl.trim(),
      payload: commentText.trim() ? { comment: commentText.trim() } : {}
    });
    setIsSubmitting(false);

    if (success) {
      setTargetUrl('');
      setCommentText('');
      closeAddTaskModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#13131A] border border-[#2A2A38] p-6 space-y-5 gold-glow relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#23232F] pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            جدولة مهمة جديدة في الطابور
          </h3>
          <button
            onClick={closeAddTaskModal}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              الحساب الفعلي المنفذ (Target Account):
            </label>
            <select
              required
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="">اختر حساباً...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.username} ({acc.status === 'active' ? 'نشط' : acc.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              نوع العملية (Task Type):
            </label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value as TaskType)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="like">إعجاب بمنشور (Like)</option>
              <option value="comment">كتابة تعليق تفاعلي (Comment)</option>
              <option value="extract_profile">فحص وتحديث البروفايل (extract_profile)</option>
              <option value="share">مشاركة منشور (Share)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
              رابط المنشور أو البروفايل (Target URL):
            </label>
            <input
              type="url"
              required
              placeholder="https://www.facebook.com/share/p/... أو https://m.facebook.com/..."
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              يقبل روابط المنشورات، المشاركات (Share URLs)، والصفحات العادية.
            </p>
          </div>

          {taskType === 'comment' && (
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                نص التعليق التفاعلي:
              </label>
              <textarea
                rows={2}
                placeholder="اكتب نص التعليق هنا..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#0E0E14] border border-[#2A2A38] text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#23232F]">
            <button
              type="button"
              onClick={closeAddTaskModal}
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
              <span>جدولة المهمة فوراً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
