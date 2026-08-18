import { NextRequest, NextResponse } from 'next/server';
import { getAppBaseUrl, getLineLoginUrl } from '@/lib/line';

export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request.headers);
  const state = Math.random().toString(36).substring(7);
  
  const loginUrl = getLineLoginUrl(baseUrl, state);
  
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set('line_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 mins
  });

  return response;
}
