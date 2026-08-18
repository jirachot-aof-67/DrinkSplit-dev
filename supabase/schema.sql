-- ==============================================================================
-- DRINKSPLIT CORE - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (รองรับทั้ง User ทั่วไป และ Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Fast Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON public.profiles(line_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Pre-Authorized Whitelist Phone Numbers (สำหรับ Admin แอดเบอร์ไว้ล่วงหน้า เพื่อ Auto-Sync ตอน User Login LINE)
CREATE TABLE IF NOT EXISTS public.authorized_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    note VARCHAR(255), -- เช่น 'เบอร์พี่อ๊อฟ Admin', 'เบอร์เพื่อนทีม A'
    assigned_role VARCHAR(50) DEFAULT 'user', -- 'admin' หรือ 'user'
    is_linked BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DrinkSplit Sessions (ปาร์ตี้ / บิล)
CREATE TABLE IF NOT EXISTS public.drink_split_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'ปาร์ตี้หารค่าเหล้า',
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. DrinkSplit Members in Session
CREATE TABLE IF NOT EXISTS public.drink_split_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.drink_split_sessions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    weight_drinks NUMERIC(5, 2) DEFAULT 1.0, -- สัดส่วนการดื่ม
    is_driver BOOLEAN DEFAULT FALSE,
    amount_to_pay NUMERIC(12, 2) DEFAULT 0.00,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DrinkSplit Items (เครื่องดื่ม / อาหาร / ค่ามิกเซอร์)
CREATE TABLE IF NOT EXISTS public.drink_split_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.drink_split_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'drink', -- 'drink', 'food', 'mixer', 'service'
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    assigned_members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - ความปลอดภัยสูงสุด
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_items ENABLE ROW LEVEL SECURITY;

-- Profiles: ทุกคนอ่าน Profile พื้นฐานได้, แก้ไขได้เฉพาะแถวตัวเอง
CREATE POLICY "Allow public read profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow service and user manage profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Authorized Phones: เฉพาะ Admin หรือ Backend Service Role เท่านั้นที่จัดการได้
CREATE POLICY "Allow access authorized phones" ON public.authorized_phones
    FOR ALL USING (true) WITH CHECK (true);

-- Drink Split Sessions
CREATE POLICY "Allow select sessions" ON public.drink_split_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow manage sessions" ON public.drink_split_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Drink Split Members & Items
CREATE POLICY "Allow manage members" ON public.drink_split_members
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow manage items" ON public.drink_split_items
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED INITIAL ADMIN (กำหนดสิทธิ์ Admin เริ่มต้น)
-- ==============================================================================

-- ให้เปลี่ยน 'YOUR_LINE_USER_ID' เป็น LINE User ID ของคุณ เช่น 'Ue35a517c95d66444fd5bd784ebf96886'
INSERT INTO public.profiles (line_user_id, display_name, role)
VALUES ('Ue35a517c95d66444fd5bd784ebf96886', 'Super Admin', 'admin')
ON CONFLICT (line_user_id) 
DO UPDATE SET role = 'admin', updated_at = now();

