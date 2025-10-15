import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function GET() {
  try {
  const supabase = await createSupabaseRouteClient();
    const { data, error } = await supabase
      .from('quizzes')
      .select(
        `*,
         questions (* )
        `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching quizzes', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch quizzes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
  const supabase = await createSupabaseRouteClient();
    const body = await request.json();

    const {
      title,
      description,
      duration_minutes,
      total_points,
      is_active = true,
      activation_cycle = 0,
    } = body ?? {};

    if (!title || !duration_minutes) {
      return NextResponse.json(
        { error: 'Title and duration are required.' },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        duration_minutes,
        total_points: total_points ?? 0,
        is_active,
        activation_cycle,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quiz', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to create quiz.' }, { status: 500 });
  }
}
