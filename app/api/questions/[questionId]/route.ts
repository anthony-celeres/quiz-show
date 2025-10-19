import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function PUT(request: Request, context: { params: Promise<{ questionId: string }> }) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { questionId } = await context.params;
    const body = await request.json();

    const {
      question_text,
      correct_answer,
      points = 1,
      type = 'identification',
      options = [],
    } = body ?? {};

    if (!question_text) {
      return NextResponse.json(
        { error: 'Question text is required.' },
        { status: 400 }
      );
    }

    // Validate question type
    if (!['multiple', 'identification', 'truefalse', 'numeric'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid question type.' },
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

    // Verify user owns the quiz that this question belongs to
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('quiz_id, quizzes!inner(created_by)')
      .eq('id', questionId)
      .maybeSingle();

    if (questionError) throw questionError;
    if (!question || (question.quizzes as any).created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('questions')
      .update({
        question_text,
        correct_answer,
        points,
        type,
        options: type === 'multiple' ? options : null,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating question', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to update question.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ questionId: string }> }) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { questionId } = await context.params;

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

    // Verify user owns the quiz that this question belongs to
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('quiz_id, quizzes!inner(created_by)')
      .eq('id', questionId)
      .maybeSingle();

    if (questionError) throw questionError;
    if (!question || (question.quizzes as any).created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting question', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete question.' }, { status: 500 });
  }
}
