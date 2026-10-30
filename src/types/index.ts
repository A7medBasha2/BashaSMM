export type AccountStatus = 'active' | 'checkpoint' | 'banned';

export interface Account {
  id: string;
  username: string;
  email: string | null;
  password?: string | null;
  avatar_url: string | null;
  status: AccountStatus;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  avatar_updated_at?: number;
}

export type TaskType = 'like' | 'comment' | 'extract_profile' | 'share';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface TaskPayload {
  comment?: string;
  note?: string;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  account_id: string;
  task_type: TaskType;
  target_url: string;
  payload: TaskPayload;
  status: TaskStatus;
  error_message: string | null;
  proof_url?: string | null;
  bot_accounts?: Account;
  created_at: string;
  updated_at: string;
}

export interface SystemStats {
  activeAccounts: number;
  checkpointAccounts: number;
  bannedAccounts: number;
  totalAccounts: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalTasks: number;
}

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SystemStatusResponse {
  isWorkerRunning: boolean;
  isProcessing: boolean;
  stats: SystemStats;
  env: {
    supabaseConnected: boolean;
    supabaseUrl: string | null;
    geminiKeyConfigured: boolean;
  };
  accounts: Account[];
  tasks: Task[];
}
