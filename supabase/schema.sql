-- ==============================================================================
-- DRINKSPLIT CORE - FULL RESET (DROP & RECREATE SCHEMA)
-- ==============================================================================

-- 0. DROP ALL EXISTING TABLES & POLICIES (ล้างข้อมูลเก่าทั้งหมดเพื่อสร้างใหม่สะอาดๆ)
DROP TABLE IF EXISTS public.drink_split_items CASCADE;
DROP TABLE IF EXISTS public.drink_split_members CASCADE;
DROP TABLE IF EXISTS public.drink_split_sessions CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.authorized_phones CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES DEFINITION
-- ==============================================================================

-- 1. Admin Users (เก็บ Admin Master ใน Database)
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) DEFAULT 'Master Administrator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles (ผู้ใช้จาก LINE Login + เบอร์โทรศัพท์)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL DEFAULT 'Party Member',
    picture_url TEXT,
    phone_number VARCHAR(20) UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin' หรือ 'user'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_profiles_line_user_id ON public.profiles(line_user_id);
CREATE INDEX idx_profiles_phone_number ON public.profiles(phone_number);

-- 3. Pre-Authorized Whitelist Phone Numbers (Admin แอดเบอร์ไว้เพื่อ Auto-Sync)
CREATE TABLE public.authorized_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    note VARCHAR(255),
    assigned_role VARCHAR(50) DEFAULT 'user',
    is_linked BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Activity & Security Audit Logs (บันทึกประวัติการ Login และความปลอดภัย)
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- 'ADMIN_LOGIN', 'LINE_LOGIN', 'SYNC_PHONE'
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    ip_address VARCHAR(100),
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 5. DrinkSplit Sessions (ปาร์ตี้ / บิล)
CREATE TABLE public.drink_split_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'ปาร์ตี้หารค่าเหล้า',
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DrinkSplit Members in Session
CREATE TABLE public.drink_split_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.drink_split_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    amount_to_pay NUMERIC(12, 2) DEFAULT 0.00,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. DrinkSplit Items
CREATE TABLE public.drink_split_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.drink_split_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'drink',
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    assigned_members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow service role admin_users" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Allow service role logs" ON public.activity_logs FOR ALL USING (true);
-- ==============================================================================
-- 3. SEED INITIAL ADMIN USER (เข้ารหัสผ่านด้วย bcrypt/pgcrypto อย่างปลอดภัย)
-- ==============================================================================

-- รหัสผ่านเริ่มต้น: Aof@DevSecDrinkSplit2026#SuperSecret! (ถูกเข้ารหัสแบบทางเดียวก่อนเก็บลงตาราง)
INSERT INTO public.admin_users (username, password_hash, full_name)
VALUES (
    'admin',
    crypt('Aof@DevSecDrinkSplit2026#SuperSecret!', gen_salt('bf', 10)),
    'Master Administrator'
)
ON CONFLICT (username) 
DO UPDATE SET 
    password_hash = crypt('Aof@DevSecDrinkSplit2026#SuperSecret!', gen_salt('bf', 10)),
    is_active = TRUE;

-- กำหนดสิทธิ์ Admin ให้ LINE ID ของคุณ
INSERT INTO public.profiles (line_user_id, display_name, role)
VALUES (
    'Ue35a517c95d66444fd5bd784ebf96886',
    'Super Admin (LINE)',
    'admin'
)
ON CONFLICT (line_user_id)
DO UPDATE SET role = 'admin';


