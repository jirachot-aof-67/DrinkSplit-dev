import { SignJWT, jwtVerify } from 'jose';

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback_dev_secret_key_32_chars_long_1234'
);

export function getAppBaseUrl(reqHeaders?: Headers): string {
  // If explicit public app url configured
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // Check headers
  if (reqHeaders) {
    const host = reqHeaders.get('x-forwarded-host') || reqHeaders.get('host');
    const proto = reqHeaders.get('x-forwarded-proto') || 'https';
    
    // If local dev
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      return `http://${host}`;
    }

    // If on main vercel custom domain
    if (host && host.includes('drink-split-dev.vercel.app')) {
      return 'https://drink-split-dev.vercel.app';
    }

    // For any other preview deployment on vercel, fallback to official main callback domain to prevent 400 Bad Request
    if (host && host.includes('vercel.app')) {
      return 'https://drink-split-dev.vercel.app';
    }

    if (host) {
      return `${proto}://${host}`;
    }
  }

  if (process.env.VERCEL_URL) {
    return 'https://drink-split-dev.vercel.app';
  }

  return 'http://localhost:3000';
}

export function getLineLoginUrl(baseUrl: string, state: string = 'dev_state'): string {
  const channelId = process.env.LINE_CHANNEL_ID || '2011158442';
  const redirectUri = `${baseUrl}/api/auth/line/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: redirectUri,
    state: state,
    scope: 'profile openid',
  });

  return `${LINE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLineCodeForProfile(code: string, baseUrl: string) {
  const channelId = process.env.LINE_CHANNEL_ID || '2011158442';
  const channelSecret = process.env.LINE_CHANNEL_SECRET || 'becbd0a21796337e9e3881a65f709503';
  const redirectUri = `${baseUrl}/api/auth/line/callback`;

  // 1. Exchange Code for Token
  const tokenResponse = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`LINE Token exchange failed: ${err}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2. Fetch User Profile
  const profileResponse = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileResponse.ok) {
    const err = await profileResponse.text();
    throw new Error(`LINE Profile fetch failed: ${err}`);
  }

  const profileData = await profileResponse.json();
  return {
    lineUserId: profileData.userId as string,
    displayName: profileData.displayName as string,
    pictureUrl: (profileData.pictureUrl as string) || '',
    statusMessage: (profileData.statusMessage as string) || '',
  };
}

// Session Token Management with JOSE (Works seamlessly on Edge / Serverless)
export async function createSessionToken(payload: {
  userId: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  phoneNumber?: string;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as {
      userId: string;
      lineUserId: string;
      displayName: string;
      pictureUrl?: string;
      phoneNumber?: string;
    };
  } catch {
    return null;
  }
}
