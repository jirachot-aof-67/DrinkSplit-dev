-- Supabase PostgreSQL Schema for DrinkSplit & Modular App

-- 1. Create profiles table linked to LINE user ID and phone
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url TEXT,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookup by LINE ID or Phone
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON public.profiles(line_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);

-- 2. DrinkSplit Sessions (Party / Bill Sessions)
CREATE TABLE IF NOT EXISTS public.drink_split_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'ปาร์ตี้หารค่าเหล้า',
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DrinkSplit Members in Session
CREATE TABLE IF NOT EXISTS public.drink_split_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.drink_split_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    line_user_id VARCHAR(255),
    avatar_url TEXT,
    weight_drinks NUMERIC(5, 2) DEFAULT 1.0, -- สัดส่วนดื่ม
    is_driver BOOLEAN DEFAULT FALSE,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DrinkSplit Items (Drinks, Food, Fees)
CREATE TABLE IF NOT EXISTS public.drink_split_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.drink_split_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'drink', -- drink, food, mixer, fee
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    assigned_members JSONB DEFAULT '[]'::jsonb, -- Array of member UUIDs or all
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_split_items ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert for testing (Adjust based on Supabase Auth in production)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (true);
