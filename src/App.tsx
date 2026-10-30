import React from 'react';
import { Header } from './components/Header';
import { QuickConnectBanner } from './components/QuickConnectBanner';
import { StatCards } from './components/StatCards';
import { AccountsList } from './components/AccountsList';
import { TaskQueue } from './components/TaskQueue';
import { LiveConsole } from './components/LiveConsole';
import { AddAccountModal } from './components/modals/AddAccountModal';
import { EditAccountModal } from './components/modals/EditAccountModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ProofModal } from './components/modals/ProofModal';
import { ToastContainer } from './components/ToastContainer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#08080A] text-slate-100 antialiased selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Header */}
      <Header />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Quick Connect & Live Sync Banner */}
        <QuickConnectBanner />

        {/* Real-time Stats Cards */}
        <StatCards />

        {/* Main Grid: Accounts & Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Accounts Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <AccountsList />
          </div>

          {/* Task Queue & Live Terminal Console (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <TaskQueue />
            <LiveConsole />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1C1C26] py-4 px-6 text-center text-xs text-slate-500">
        <p>Basha SMM © 2026 - نظام إدارة وأتمتة حسابات السوشيال ميديا ومحرك الأوتوميشن الخفي</p>
      </footer>

      {/* Modals & Notifications */}
      <AddAccountModal />
      <EditAccountModal />
      <AddTaskModal />
      <SettingsModal />
      <ProofModal />
      <ToastContainer />
    </div>
  );
};

export default App;
