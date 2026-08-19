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

// PATCH: Update User or Whitelist Phone Role
export async function PATCH(request: NextRequest) {
  try {
    const client = getServiceSupabase();
    const { type, id, role } = await request.json();

    if (!id || !role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    if (type === 'profile') {
      const { error } = await client
        .from('profiles')
        .update({ role })
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'phone') {
      const { error } = await client
        .from('authorized_phones')
        .update({ assigned_role: role })
        .eq('id', id);

      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Type ไม่ถูกต้อง' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `อัปเดตสิทธิ์เป็น ${role} เรียบร้อย!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete profile or whitelist phone
export async function DELETE(request: NextRequest) {
  try {
    const client = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ error: 'ระบุ ID และ Type ที่ต้องการลบ' }, { status: 400 });
    }

    if (type === 'profile') {
      const { error } = await client
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'phone') {
      const { error } = await client
        .from('authorized_phones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Type ไม่ถูกต้อง' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'ลบรายการสำเร็จ' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
