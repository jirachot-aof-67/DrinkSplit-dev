import { NextRequest, NextResponse } from 'next/server';
import { exchangeLineCodeForProfile, getAppBaseUrl, createSessionToken } from '@/lib/line';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = getAppBaseUrl(request.headers);

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(errorDescription || 'Access denied')}`);
  }

  try {
    // 1. Fetch LINE User Profile
    const profile = await exchangeLineCodeForProfile(code, baseUrl);

    // 2. Query Supabase Database for User Profile
    let dbUser = null;
    let phoneNumber: string | undefined = undefined;

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('line_user_id', profile.lineUserId)
        .maybeSingle();

      if (!dbError && data) {
        dbUser = data;
        phoneNumber = data.phone_number || undefined;
      }
    } catch {
      // Supabase connection or table not yet configured fallback
      console.warn('Supabase not connected yet. Operating in standalone demo mode.');
    }

    // 3. Log Activity to Supabase
    try {
      const client = getServiceSupabase();
      await client.from('activity_logs').insert([
        {
          user_id: profile.lineUserId,
          action: 'LINE_LOGIN',
          status: 'SUCCESS',
          details: { displayName: profile.displayName, phoneNumber: phoneNumber || 'not_synced' },
        },
      ]);
    } catch (logErr) {
      console.warn('LINE login log write failed:', logErr);
    }

    // 4. Create Session Token
    const sessionToken = await createSessionToken({
      userId: dbUser?.id || profile.lineUserId,
      lineUserId: profile.lineUserId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      phoneNumber: phoneNumber,
    });

    // 4. Determine Redirection: If no phone number attached yet, direct to sync-phone
    let targetUrl = `${baseUrl}/dashboard`;
    if (!phoneNumber) {
      targetUrl = `${baseUrl}/sync-phone`;
    }

    const response = NextResponse.redirect(targetUrl);
    response.cookies.set('user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(err.message || 'Auth failed')}`);
  }
}
