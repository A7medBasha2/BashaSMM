import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Account, Task, LogEntry, SystemStats } from '../types';
import { api } from '../services/api';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  accounts: Account[];
  tasks: Task[];
  logs: LogEntry[];
  stats: SystemStats;
  isWorkerRunning: boolean;
  isProcessing: boolean;
  dbConnected: boolean;
  dbUrl: string | null;
  loading: boolean;
  toasts: Toast[];
  
  // Modals state
  isAddAccountOpen: boolean;
  isEditAccountOpen: boolean;
  isAddTaskOpen: boolean;
  isSettingsOpen: boolean;
  isProofModalOpen: boolean;
  selectedProofUrl: string | null;
  editingAccount: Account | null;
  selectedAccountForTask: string | null;

  // Actions
  refreshAll: () => Promise<void>;
  openAddAccountModal: () => void;
  closeAddAccountModal: () => void;
  openEditAccountModal: (account: Account) => void;
  closeEditAccountModal: () => void;
  openAddTaskModal: (accountId?: string) => void;
  closeAddTaskModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openProofModal: (proofUrl: string) => void;
  closeProofModal: () => void;

  // Operations
  createAccount: (data: { username: string; email?: string; password?: string; cookies?: string }) => Promise<boolean>;
  updateAccount: (id: string, data: { username?: string; email?: string; password?: string; status?: string; cookies?: string }) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  checkAccount: (id: string) => Promise<void>;
  syncAvatar: (id: string) => Promise<void>;
  syncAllAvatars: () => Promise<void>;
  createTask: (data: { account_id: string; task_type: string; target_url: string; payload?: Record<string, unknown> }) => Promise<boolean>;
  toggleWorker: () => Promise<void>;
  triggerImmediateRun: () => Promise<void>;
  saveSettings: (url: string, key: string) => Promise<boolean>;
  clearLogs: () => void;
  removeToast: (id: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const defaultStats: SystemStats = {
  activeAccounts: 0,
  checkpointAccounts: 0,
  bannedAccounts: 0,
  totalAccounts: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  totalTasks: 0
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      time: new Date().toISOString(),
      message: 'لوحة تحكم Basha SMM جاهزة وتعمل بنجاح.',
      type: 'info'
    }
  ]);
  const [stats, setStats] = useState<SystemStats>(defaultStats);
  const [isWorkerRunning, setIsWorkerRunning] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [dbUrl, setDbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountForTask, setSelectedAccountForTask] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + '-' + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setAccounts(data.accounts || []);
      setTasks(data.tasks || []);
      setStats(data.stats || defaultStats);
      setIsWorkerRunning(data.isWorkerRunning ?? true);
      setIsProcessing(data.isProcessing ?? false);
      setDbConnected(data.env?.supabaseConnected ?? false);
      setDbUrl(data.env?.supabaseUrl ?? null);
    } catch (e: any) {
      console.warn('Refresh error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const lastId = logs.length > 0 ? logs[logs.length - 1].id : 0;
      const data = await api.getLogs(lastId);
      if (data.logs && data.logs.length > 0) {
        setLogs(prev => {
          const newLogs = [...prev, ...data.logs];
          return newLogs.slice(-300);
        });
      }
    } catch {
      // silently ignore polling failure
    }
  }, [logs]);

  // Initial load & Polling
  useEffect(() => {
    refreshAll();
    const statusInterval = setInterval(refreshAll, 4000);
    const logsInterval = setInterval(fetchLogs, 2500);

    return () => {
      clearInterval(statusInterval);
      clearInterval(logsInterval);
    };
  }, [refreshAll, fetchLogs]);

  // Modal open/close helpers
  const openAddAccountModal = () => setIsAddAccountOpen(true);
  const closeAddAccountModal = () => setIsAddAccountOpen(false);

  const openEditAccountModal = (account: Account) => {
    setEditingAccount(account);
    setIsEditAccountOpen(true);
  };
  const closeEditAccountModal = () => {
    setEditingAccount(null);
    setIsEditAccountOpen(false);
  };

  const openAddTaskModal = (accountId?: string) => {
    setSelectedAccountForTask(accountId || null);
    setIsAddTaskOpen(true);
  };
  const closeAddTaskModal = () => {
    setSelectedAccountForTask(null);
    setIsAddTaskOpen(false);
  };

  const openSettingsModal = () => setIsSettingsOpen(true);
  const closeSettingsModal = () => setIsSettingsOpen(false);

  const openProofModal = (proofUrl: string) => {
    setSelectedProofUrl(proofUrl);
    setIsProofModalOpen(true);
  };
  const closeProofModal = () => {
    setSelectedProofUrl(null);
    setIsProofModalOpen(false);
  };

  const clearLogs = () => {
    setLogs([]);
    addToast('تم مسح سجل الأحداث المباشر', 'info');
  };

  // Operations
  const createAccount = async (data: {
    username: string;
    email?: string;
    password?: string;
    cookies?: string;
  }): Promise<boolean> => {
    try {
      const res = await api.createAccount(data);
      if (res.success && res.account) {
        addToast(`تم تسجيل الحساب بنجاح: ${res.account.username}`, 'success');
        await refreshAll();
        return true;
      } else {
        addToast(res.message || 'فشل حفظ الحساب', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'حدث خطأ أثناء حفظ الحساب', 'error');
      return false;
    }
  };

  const updateAccount = async (
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      status?: string;
      cookies?: string;
    }
  ): Promise<boolean> => {
    try {
      const res = await api.updateAccount(id, data);
      if (res.success && res.account) {
        addToast(`تم تحديث بيانات الحساب: ${res.account.username}`, 'success');
        await refreshAll();
        return true;
      } else {
        addToast(res.message || 'فشل تعديل الحساب', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'حدث خطأ أثناء تعديل الحساب', 'error');
      return false;
    }
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    try {
      const res = await api.deleteAccount(id);
      if (res.success) {
        addToast('تم حذف الحساب بنجاح', 'success');
        await refreshAll();
        return true;
      } else {
        addToast(res.message || 'فشل حذف الحساب', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'حدث خطأ أثناء حذف الحساب', 'error');
      return false;
    }
  };

  const checkAccount = async (id: string) => {
    try {
      addToast('جاري فحص الحساب بالمتصفح الحقيقي...', 'info');
      const res = await api.checkAccount(id);
      if (res.success) {
        addToast(res.message || 'تم فحص الحساب بنجاح وهو نشط!', 'success');
      } else {
        addToast(res.message || 'الحساب يواجه عائقاً أمنياً', 'error');
      }
      await refreshAll();
    } catch (e: any) {
      addToast(e.message || 'تعذر فحص الحساب', 'error');
    }
  };

  const syncAvatar = async (id: string) => {
    try {
      addToast('جاري مزامنة صورة البروفايل من فيسبوك...', 'info');
      const res = await api.syncAvatar(id);
      if (res.success) {
        addToast('تم تحديث ومزامنة صورة البروفايل بنجاح!', 'success');
      } else {
        addToast(res.message || 'فشلت المزامنة', 'error');
      }
      await refreshAll();
    } catch (e: any) {
      addToast(e.message || 'تعذر مزامنة الصورة', 'error');
    }
  };

  const syncAllAvatars = async () => {
    addToast('بدء فحص ومزامنة صور جميع الحسابات الحقيقية...', 'info');
    for (const acc of accounts) {
      if (acc.status === 'active') {
        await api.syncAvatar(acc.id);
      }
    }
    await refreshAll();
    addToast('اكتملت مزامنة صور الحسابات بنجاح!', 'success');
  };

  const createTask = async (data: {
    account_id: string;
    task_type: string;
    target_url: string;
    payload?: Record<string, unknown>;
  }): Promise<boolean> => {
    try {
      const res = await api.createTask(data);
      if (res.success) {
        addToast('تمت جدولة المهمة بنجاح في الطابور!', 'success');
        await refreshAll();
        return true;
      } else {
        addToast(res.message || 'فشل جدولة المهمة', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'تعذر إضافة المهمة', 'error');
      return false;
    }
  };

  const toggleWorker = async () => {
    try {
      const res = await api.toggleWorker();
      setIsWorkerRunning(res.isWorkerRunning);
      addToast(res.message, res.isWorkerRunning ? 'success' : 'info');
      await refreshAll();
    } catch (e: any) {
      addToast(e.message || 'تعذر تبديل حالة الطابور', 'error');
    }
  };

  const triggerImmediateRun = async () => {
    try {
      addToast('جاري معالجة أول مهمة معلقة في الطابور فوراً...', 'info');
      const res = await api.triggerImmediateRun();
      addToast(res.message, res.success ? 'success' : 'info');
      await refreshAll();
    } catch (e: any) {
      addToast(e.message || 'تعذر تنفيذ المهمة', 'error');
    }
  };

  const saveSettings = async (url: string, key: string): Promise<boolean> => {
    try {
      const res = await api.saveSettings({ supabase_url: url, supabase_key: key });
      addToast(res.message, res.success ? 'success' : 'error');
      await refreshAll();
      return res.success;
    } catch (e: any) {
      addToast(e.message || 'فشل حفظ الإعدادات', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        tasks,
        logs,
        stats,
        isWorkerRunning,
        isProcessing,
        dbConnected,
        dbUrl,
        loading,
        toasts,
        isAddAccountOpen,
        isEditAccountOpen,
        isAddTaskOpen,
        isSettingsOpen,
        isProofModalOpen,
        selectedProofUrl,
        editingAccount,
        selectedAccountForTask,
        refreshAll,
        openAddAccountModal,
        closeAddAccountModal,
        openEditAccountModal,
        closeEditAccountModal,
        openAddTaskModal,
        closeAddTaskModal,
        openSettingsModal,
        closeSettingsModal,
        openProofModal,
        closeProofModal,
        createAccount,
        updateAccount,
        deleteAccount,
        checkAccount,
        syncAvatar,
        syncAllAvatars,
        createTask,
        toggleWorker,
        triggerImmediateRun,
        saveSettings,
        clearLogs,
        removeToast,
        addToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
