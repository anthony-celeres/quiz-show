import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function GET(_request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { attemptId } = await context.params;

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

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(
        `*,
         quiz:quizzes (*, questions (*))
        `
      )
      .eq('id', attemptId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    }

    const role = user.user_metadata?.role;
    if (role !== 'admin' && data.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching attempt', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch attempt.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
  const supabase = await createSupabaseRouteClient();
    const { attemptId } = await context.params;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { error } = await supabase.from('quiz_attempts').delete().eq('id', attemptId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting attempt', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete attempt.' }, { status: 500 });
  }
}
