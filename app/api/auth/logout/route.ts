import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function POST() {
  try {
  const supabase = await createSupabaseRouteClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error during logout', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to logout.' }, { status: 500 });
  }
}
