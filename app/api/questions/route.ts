import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const body = await request.json();

    const {
      quiz_id,
      question_text,
      correct_answer,
      points = 1,
      type = 'identification',
      options = [],
    } = body ?? {};

    if (!quiz_id || !question_text) {
      return NextResponse.json(
        { error: 'Quiz ID and question text are required.' },
        { status: 400 }
      );
    }

    // Validate question type
    if (!['multiple', 'identification', 'truefalse'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid question type. Must be "multiple", "identification", or "truefalse".' },
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

    // Verify user owns the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('created_by')
      .eq('id', quiz_id)
      .maybeSingle();

    if (quizError) throw quizError;
    if (!quiz || quiz.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        quiz_id,
        question_text,
        correct_answer,
        points,
        type,
        options: type === 'multiple' ? options : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to create question.' }, { status: 500 });
  }
}
