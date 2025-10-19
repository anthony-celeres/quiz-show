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

    // Allow the attempt owner or the creator of the quiz to view the attempt
    const quizOwnerCheck = await supabase
      .from('quizzes')
      .select('created_by')
      .eq('id', data.quiz_id)
      .maybeSingle();
    if (quizOwnerCheck.error) throw quizOwnerCheck.error;

    const quizOwnerId = quizOwnerCheck.data?.created_by;
    if (data.user_id !== user.id && quizOwnerId !== user.id) {
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Allow the attempt owner or the quiz creator to delete
    const attempt = await supabase.from('quiz_attempts').select('user_id, quiz_id').eq('id', attemptId).maybeSingle();
    if (attempt.error) throw attempt.error;
    if (!attempt.data) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });

    const quiz = await supabase.from('quizzes').select('created_by').eq('id', attempt.data.quiz_id).maybeSingle();
    if (quiz.error) throw quiz.error;

    const canDelete = attempt.data.user_id === user.id || quiz.data?.created_by === user.id;
    if (!canDelete) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

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
