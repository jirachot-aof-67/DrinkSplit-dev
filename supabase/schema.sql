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
-- 8. Site Settings & Landing Page Config (เก็บโหมดหน้าแรกและข้อมูล Resume ใน Database)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow service role site_settings" ON public.site_settings FOR ALL USING (true);

-- Seed Default Landing & Resume Config
INSERT INTO public.site_settings (key, value)
VALUES (
    'landing_config',
    json_build_object(
        'mode', 'resume',
        'resumeData', json_build_object(
            'name', 'JIRACHOT YAAAUN',
            'title', 'Software Developer / IT Support Infra',
            'bio', 'นักพัฒนาซอฟต์แวร์และผู้ดูแลระบบโครงสร้างพื้นฐานไอที มุ่งเน้นการสร้างสรรค์โซลูชันระบบอัตโนมัติ การบริหารจัดการฐานข้อมูล และพัฒนาระบบ Intranet/Web Applications เพื่อเพิ่มประสิทธิภาพองค์กร',
            'avatarUrl', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
            'contact', json_build_object(
                'phone', '098-4577638',
                'email', 'jirachotaof@gmail.com',
                'address', '118 ม.6 ต.มะขุนหวาน อ.สันป่าตอง จ.เชียงใหม่',
                'lineId', 'jirachotaof'
            ),
            'expertise', json_build_array(
                'Full Stack Developer',
                'Python programmer',
                'PHP programmer',
                'IT Support & Network Infra',
                'Video editor & Media',
                'E-Commerce Marketing'
            ),
            'skills', json_build_array(
                'Python', 'Sourcetree', 'Git / GitHub', 'PHP', 'SQL Server',
                'JavaScript / TypeScript', 'HTML5 / CSS3', 'VS Code',
                'Microsoft Office', 'Adobe Photoshop', 'Adobe Premiere Pro', 'Adobe Illustrator'
            ),
            'experiences', json_build_array(
                json_build_object(
                    'role', 'Software Developer / IT Support Infra',
                    'period', 'ตุลาคม 2567 - ปัจจุบัน',
                    'company', 'Hylife Global Food - พัฒนาโปรแกรมด้วยภาษา Python',
                    'description', json_build_array(
                        'Python Development: พัฒนาโปรแกรมด้วย Python และจัดการ Source Code ผ่าน Git/Sourcetree (GitHub, Bitbucket) Docker หรือ พัฒนาโปรแกรมให้สอดคล้องกับความต้องการของผู้ใช้หรือแผนกต่างๆ',
                        'QMS Request System: สร้างระบบอนุมัติและแก้ไขเอกสารมาตรฐานคุณภาพ (Approve/Revised) ตามลำดับสายงาน',
                        'Warehouse & Production Support: ระบบส่งบิลและติดตามสถานะการผลิต-จัดส่งสินค้าแบบ Real-time',
                        'SO Tracking System: ระบบติดตามสถานะใบสั่งขาย (Sales Order) และระยะเวลาการดำเนินงานของแต่ละแผนก',
                        'IT Management System: ระบบแจ้งซ่อม, จัดเก็บ Inventory, และเบิก-ถอน-ยืม อุปกรณ์ไอที (IT Borrow)',
                        'Car Booking: ระบบจองรถออนไลน์เพื่อบริหารจัดการคิวรถและติดตามสถานะการใช้งานอย่างเป็นระบบ',
                        'Car Tracking: ระบบติดตามการใช้งานรถรับ-ส่งพนักงานและลูกค้า',
                        'Warehouse Management System: ระบบบริหารจัดการคลังสินค้าแบบครบวงจรของบริษัท',
                        'Intranet Portal: พัฒนาเว็บรวมข้อมูลภายในองค์กร โดยประยุกต์ใช้ AI และ Google AppSheet',
                        'IT Support Infra: ติดตั้งและดูแลระบบ CCTV ทั่วทั้งองค์กร, วางระบบและดูแลโครงสร้างพื้นฐาน Network ทั้งหมดขององค์กร, Server & Database ติดตั้งและบริหารจัดการ Server Database ผ่าน Domain/Sub-domain เพื่อรองรับระบบ Intranet'
                    ),
                    'images', json_build_array()
                ),
                json_build_object(
                    'role', 'IT Support',
                    'period', 'มิถุนายน 2567 - กันยายน 2567',
                    'company', 'โรงพยาบาลลำพูนใกล้หมอ',
                    'description', json_build_array(
                        'เจ้าหน้าที่ IT Support ดูแลระบบเครือข่าย ทำเว็บ intranet ภายในองค์กร',
                        'เช็คกล้อง CCTV ดูแลตรวจสอบระบบคอมพิวเตอร์ เครื่องปริ้น ภายในองค์กร',
                        'เซ็ตระบบหน้างาน ประชุม zoom หรือ meeting ต่างๆ'
                    ),
                    'images', json_build_array()
                ),
                json_build_object(
                    'role', 'IT Support',
                    'period', 'กันยายน 2564 - มิถุนายน 2567',
                    'company', 'สหกรณ์การเกษตรสันป่าตอง จำกัด',
                    'description', json_build_array(
                        'เจ้าหน้าที่ IT Support ดูแลระบบคอมพิวเตอร์ เครื่องปรับระบบหน้างาน',
                        'ตัดต่อ VIDEO ถ่ายภาพแต่งภาพ เซ็ตระบบหน้างาน ประชุมต่างๆ ประชุมออนไลน์',
                        'ดูแลระบบเครือข่าย เขียนโปรแกรมซัพพอร์ตหน้างาน'
                    ),
                    'images', json_build_array()
                )
            ),
            'education', json_build_array(
                json_build_object(
                    'institution', 'มหาวิทยาลัยราชภัฏเชียงใหม่',
                    'period', 'พ.ศ. 2559 - 2563',
                    'degree', 'Business Computer'
                ),
                json_build_object(
                    'institution', 'โรงเรียน เมธีวุฒิกรฯ ลำพูน',
                    'period', 'มัธยมศึกษาตอนปลาย พ.ศ. 2557 - 2559 | มัธยมศึกษาตอนต้น พ.ศ. 2554 - 2556',
                    'degree', 'มัธยมศึกษา'
                )
            )
        )
    )
)
ON CONFLICT (key) DO NOTHING;



