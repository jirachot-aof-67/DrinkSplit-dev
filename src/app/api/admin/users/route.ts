import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// GET: Fetch all profiles & authorized phones
export async function GET() {
  try {
    const client = getServiceSupabase();

    const { data: profiles, error: pError } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: phones, error: phError } = await client
      .from('authorized_phones')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      profiles: profiles || [],
      phones: phones || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add pre-authorized phone to whitelist
export async function POST(request: NextRequest) {
  try {
    const client = getServiceSupabase();
    const { phoneNumber, note, assignedRole } = await request.json();

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      return NextResponse.json({ error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.trim().replace(/[-\s]/g, '');

    const { data, error } = await client
      .from('authorized_phones')
      .insert([
        {
          phone_number: cleanPhone,
          note: note || '',
          assigned_role: assignedRole || 'user',
        },
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'เบอร์โทรศัพท์นี้มีอยู่ใน Whitelist แล้ว' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
