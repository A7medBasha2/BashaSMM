-- ==============================================================================
-- Basha SMM Bot Engine - Supabase PostgreSQL Schema
-- ==============================================================================
-- مخطط قاعدة البيانات لإدارة حسابات السوشيال ميديا وطوابير المهام المؤتمتة
-- ==============================================================================

-- تفعيل ملحق توليد المعرفات الفريدة UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. جدول الحسابات: bot_accounts
CREATE TABLE IF NOT EXISTS public.bot_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'checkpoint', 'banned')),
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول المهام: bot_tasks
CREATE TABLE IF NOT EXISTS public.bot_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.bot_accounts(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('like', 'comment', 'share', 'extract_profile')),
    target_url TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهارس لتحسين سرعة سحب المهام والفلترة (FIFO Queue Indexing)
CREATE INDEX IF NOT EXISTS idx_bot_tasks_status_created 
ON public.bot_tasks (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_bot_tasks_account 
ON public.bot_tasks (account_id);

CREATE INDEX IF NOT EXISTS idx_bot_accounts_status 
ON public.bot_accounts (status);

-- دالة وتريجر لتحديث حقل updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_bot_accounts ON public.bot_accounts;
CREATE TRIGGER set_timestamp_bot_accounts
BEFORE UPDATE ON public.bot_accounts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_bot_tasks ON public.bot_tasks;
CREATE TRIGGER set_timestamp_bot_tasks
BEFORE UPDATE ON public.bot_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- تفعيل صلاحيات الوصول وقواعد الأمان (Row Level Security)
ALTER TABLE public.bot_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_tasks ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (للسماح بالوصول الكامل لـ Service Role و Anon للقراءة والإضافة)
CREATE POLICY "Allow public read access for bot_accounts" 
ON public.bot_accounts FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update for bot_accounts" 
ON public.bot_accounts FOR ALL USING (true);

CREATE POLICY "Allow public read access for bot_tasks" 
ON public.bot_tasks FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update for bot_tasks" 
ON public.bot_tasks FOR ALL USING (true);

-- بيانات أولية تجريبية (Initial Seed Data)
INSERT INTO public.bot_accounts (username, email, password, avatar_url, status)
VALUES 
('أحمد الباشا - حساب رئيسي', 'basha.lead@example.com', 'SecureP@ss2026', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 'active'),
('سارة إبراهيم - تسويق عقاري', 'sarah.marketing@example.com', 'SecureP@ss2026', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 'active')
ON CONFLICT (email) DO NOTHING;

-- إدراج مهام تجريبية مرتبطة بالحساب الأول
INSERT INTO public.bot_tasks (account_id, task_type, target_url, payload, status)
SELECT 
    id, 
    'extract_profile', 
    'https://m.facebook.com/me', 
    '{"note": "استخراج وتحديث الصورة الشخصية والاسم"}'::jsonb, 
    'pending'
FROM public.bot_accounts 
WHERE email = 'basha.lead@example.com'
LIMIT 1;
