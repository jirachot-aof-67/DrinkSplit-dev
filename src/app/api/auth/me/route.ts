import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/line';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('user_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, isAdmin: false });
    }

    const session = await verifySessionToken(sessionCookie);
    if (!session) {
      return NextResponse.json({ authenticated: false, isAdmin: false });
    }

    // Check if user is admin
    let isAdmin = false;
    if (session.lineUserId?.startsWith('admin_') || session.userId?.includes('admin')) {
      isAdmin = true;
    } else {
      // Check from DB profile role
      try {
        const client = getServiceSupabase();
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('line_user_id', session.lineUserId)
          .maybeSingle();

        if (profile?.role === 'admin') {
          isAdmin = true;
        }
      } catch (e) {
        console.warn('Profile check error:', e);
      }
    }

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      user: {
        displayName: session.displayName,
        pictureUrl: session.pictureUrl,
        phoneNumber: session.phoneNumber,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, isAdmin: false, error: error.message });
  }
}
