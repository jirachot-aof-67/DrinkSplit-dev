import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/line';
import { getServiceSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  try {
    const { username, password } = await request.json();
    const cleanUser = username?.trim();
    const cleanPass = password?.trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json({ error: 'กรุณากรอก Username และ Password' }, { status: 400 });
    }

    const client = getServiceSupabase();
    let isValid = false;
    let adminRecord: any = null;

    // 1. Check from Supabase DB `admin_users` table with bcrypt hash verify
    try {
      const { data: dbAdmin, error } = await client
        .from('admin_users')
        .select('*')
        .eq('username', cleanUser)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && dbAdmin) {
        // Support bcrypt hash check ($2a$, $2b$) or plain
        const isMatch = dbAdmin.password_hash.startsWith('$2')
          ? await bcrypt.compare(cleanPass, dbAdmin.password_hash)
          : dbAdmin.password_hash === cleanPass;

        if (isMatch) {
          isValid = true;
          adminRecord = dbAdmin;
          await client.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', dbAdmin.id);
        }
      }
    } catch (e) {
      console.warn('Supabase admin lookup fallback to env');
    }

    // 2. Fallback to Env Master Admin
    const envAdminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const envAdminPass = (process.env.ADMIN_PASSWORD || 'Aof@DevSecDrinkSplit2026#SuperSecret!').trim();

    if (!isValid && cleanUser === envAdminUser && cleanPass === envAdminPass) {
      isValid = true;
      adminRecord = {
        id: 'env_master_root',
        username: envAdminUser,
        full_name: 'Master Administrator (Root)',
      };
    }

    // 3. Log Activity to Supabase
    try {
      await client.from('activity_logs').insert([
        {
          user_id: cleanUser,
          action: 'ADMIN_LOGIN',
          status: isValid ? 'SUCCESS' : 'FAILED',
          ip_address: ip,
          user_agent: userAgent,
          details: { username: cleanUser, timestamp: new Date().toISOString() },
        },
      ]);
    } catch (logErr) {
      console.warn('Audit log write error:', logErr);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
    }

    // 4. Create Session Token
    const sessionToken = await createSessionToken({
      userId: adminRecord?.id || 'admin_master_root',
      lineUserId: `admin_${cleanUser}`,
      displayName: adminRecord?.full_name || 'Super Admin',
      phoneNumber: 'ADMIN-ACCESS',
    });

    const response = NextResponse.json({ success: true, redirect: '/admin' });
    response.cookies.set('user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login error' }, { status: 500 });
  }
}
