import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, createSessionToken } from '@/lib/line';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('user_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySessionToken(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();
    if (!phoneNumber || phoneNumber.trim().length < 9) {
      return NextResponse.json({ error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.trim().replace(/[-\s]/g, '');

    // Upsert into Supabase profiles
    try {
      await supabase
        .from('profiles')
        .upsert(
          {
            line_user_id: session.lineUserId,
            display_name: session.displayName,
            picture_url: session.pictureUrl,
            phone_number: cleanPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'line_user_id' }
        );
    } catch (dbErr) {
      console.warn('Supabase profile sync warning (table may need setup):', dbErr);
    }

    // Refresh token with new phone number
    const updatedToken = await createSessionToken({
      ...session,
      phoneNumber: cleanPhone,
    });

    const response = NextResponse.json({ success: true, redirect: '/dashboard' });
    response.cookies.set('user_session', updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
