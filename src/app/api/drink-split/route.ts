import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET: Fetch all venues, bills, and friends for current user/session
export async function GET() {
  try {
    const client = getServiceSupabase();

    // 1. Fetch Sessions (Venues / Parties)
    const { data: sessions, error: sErr } = await client
      .from('drink_split_sessions')
      .select(`
        id,
        title,
        location,
        status,
        total_amount,
        created_at,
        drink_split_members (
          id,
          name,
          phone_number,
          amount_to_pay,
          paid
        ),
        drink_split_items (
          id,
          name,
          category,
          price,
          quantity
        )
      `)
      .order('created_at', { ascending: false });

    // 2. Fetch Profiles for Member Selection
    const { data: profiles } = await client
      .from('profiles')
      .select('id, display_name, phone_number, picture_url')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      sessions: sessions || [],
      profiles: profiles || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new party bill in Supabase PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const client = getServiceSupabase();
    const body = await request.json();
    const { title, location, totalAmount, members, items } = body;

    if (!title || !totalAmount || members?.length === 0) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // 1. Create Session
    const { data: session, error: sErr } = await client
      .from('drink_split_sessions')
      .insert([
        {
          title: title.trim(),
          location: location?.trim() || '',
          total_amount: Number(totalAmount),
          status: 'active',
        },
      ])
      .select()
      .single();

    if (sErr) throw sErr;

    // 2. Create Members
    const membersToInsert = members.map((m: any) => ({
      session_id: session.id,
      name: m.name,
      phone_number: m.phone || null,
      amount_to_pay: Number(m.amountToPay || 0),
      paid: Boolean(m.paid || false),
    }));

    const { error: mErr } = await client
      .from('drink_split_members')
      .insert(membersToInsert);

    if (mErr) throw mErr;

    // 3. Create Items (if any)
    if (items && items.length > 0) {
      const itemsToInsert = items.map((it: any) => ({
        session_id: session.id,
        name: it.name,
        category: it.category || 'drink',
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
      }));

      await client.from('drink_split_items').insert(itemsToInsert);
    }

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
