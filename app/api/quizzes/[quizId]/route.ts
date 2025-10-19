import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function GET(_request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { quizId } = await context.params;

    const { data, error } = await supabase
      .from('quizzes')
      .select(
        `*,
         questions (*)
        `
      )
      .eq('id', quizId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error retrieving quiz', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch quiz.' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
  const supabase = await createSupabaseRouteClient();
    const { quizId } = await context.params;
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

    // Ensure the authenticated user is the creator of the quiz
    const ownerCheck = await supabase.from('quizzes').select('created_by').eq('id', quizId).maybeSingle();
    if (ownerCheck.error) throw ownerCheck.error;
    if (!ownerCheck.data || ownerCheck.data.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('quizzes')
      .update(payload)
      .eq('id', quizId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating quiz', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to update quiz.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
  const supabase = await createSupabaseRouteClient();
    const { quizId } = await context.params;

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

    // Ensure the authenticated user is the creator of the quiz
    const ownerCheck = await supabase.from('quizzes').select('created_by').eq('id', quizId).maybeSingle();
    if (ownerCheck.error) throw ownerCheck.error;
    if (!ownerCheck.data || ownerCheck.data.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting quiz', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete quiz.' }, { status: 500 });
  }
}
