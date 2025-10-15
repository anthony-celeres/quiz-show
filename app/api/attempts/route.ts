import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
  const supabase = await createSupabaseRouteClient();
    const url = new URL(request.url);
    const quizId = url.searchParams.get('quizId');

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

    let builder = supabase
      .from('quiz_attempts')
      .select(
        `*,
         quiz:quizzes (title, description)
        `
      )
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (quizId) {
      builder = builder.eq('quiz_id', quizId);
    }

    const { data, error } = await builder;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching attempts', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch attempts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
  const supabase = await createSupabaseRouteClient();
    const payload = await request.json();

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

    const { quiz_id, score, total_points, percentage, time_taken, answers, activation_cycle = 0 } = payload ?? {};

    if (!quiz_id) {
      return NextResponse.json({ error: 'quiz_id is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id,
        user_id: user.id,
        user_email: user.email,
        score: score ?? 0,
        total_points: total_points ?? 0,
        percentage: percentage ?? 0,
        time_taken: time_taken ?? 0,
        answers: answers ?? {},
        activation_cycle,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating attempt', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to record attempt.' }, { status: 500 });
  }
}
