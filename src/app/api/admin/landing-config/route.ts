import { NextRequest, NextResponse } from 'next/server';
import { defaultResumeData, LandingConfig } from '@/modules/resume/types/resume';
import { getServiceSupabase } from '@/lib/supabase';

// Fallback in-memory config
let memoryConfig: LandingConfig = {
  mode: 'resume',
  resumeData: defaultResumeData,
};

export async function GET() {
  try {
    const client = getServiceSupabase();
    const { data, error } = await client
      .from('site_settings')
      .select('value')
      .eq('key', 'landing_config')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(memoryConfig);
    }

    return NextResponse.json(data.value);
  } catch (err) {
    console.warn('Failed to load from supabase site_settings, fallback to memory:', err);
    return NextResponse.json(memoryConfig);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const client = getServiceSupabase();

    // 1. Fetch current
    let current = { ...memoryConfig };
    try {
      const { data } = await client
        .from('site_settings')
        .select('value')
        .eq('key', 'landing_config')
        .maybeSingle();

      if (data?.value) {
        current = data.value;
      }
    } catch (e) {
      console.warn('Fetch current config error:', e);
    }

    // 2. Merge changes
    if (body.mode) {
      current.mode = body.mode;
    }
    if (body.resumeData) {
      current.resumeData = {
        ...current.resumeData,
        ...body.resumeData,
      };
    }

    memoryConfig = current;

    // 3. Upsert to Supabase
    try {
      await client
        .from('site_settings')
        .upsert(
          {
            key: 'landing_config',
            value: current,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
    } catch (dbErr) {
      console.error('Failed to save to Supabase site_settings:', dbErr);
    }

    return NextResponse.json({ 
      success: true, 
      config: current,
      env: isProduction ? 'production' : 'development'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
