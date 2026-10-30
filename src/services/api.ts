import type {
  Account,
  Task,
  LogEntry,
  SystemStatusResponse
} from '../types';

export const api = {
  async getStatus(): Promise<SystemStatusResponse> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async getLogs(afterId: number = 0): Promise<{ logs: LogEntry[] }> {
    const res = await fetch(`/api/logs?after=${afterId}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  async getAccounts(): Promise<{ accounts: Account[] }> {
    const res = await fetch('/api/accounts');
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  async createAccount(data: {
    username: string;
    email?: string;
    password?: string;
    avatar_url?: string;
    cookies?: string;
  }): Promise<{ success: boolean; account?: Account; message?: string }> {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateAccount(
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      avatar_url?: string;
      status?: string;
      cookies?: string;
    }
  ): Promise<{ success: boolean; account?: Account; message?: string }> {
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteAccount(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async checkAccount(id: string): Promise<{ success: boolean; message?: string; account?: Account; proofUrl?: string }> {
    const res = await fetch(`/api/accounts/${id}/check`, {
      method: 'POST'
    });
    return res.json();
  },

  async syncAvatar(id: string): Promise<{ success: boolean; message?: string; avatarUrl?: string; avatar_updated_at?: number }> {
    const res = await fetch(`/api/accounts/${id}/sync-avatar`, {
      method: 'POST'
    });
    return res.json();
  },

  async createTask(data: {
    account_id?: string;
    task_type: string;
    target_url: string;
    payload?: Record<string, unknown>;
  }): Promise<{ success: boolean; task?: Task; message?: string }> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async toggleWorker(): Promise<{ isWorkerRunning: boolean; message: string }> {
    const res = await fetch('/api/worker/toggle', {
      method: 'POST'
    });
    return res.json();
  },

  async triggerImmediateRun(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/run', {
      method: 'POST'
    });
    return res.json();
  },

  async saveSettings(data: {
    supabase_url: string;
    supabase_key: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
