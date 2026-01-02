import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../db/supabase.server';

// GET /api/daily-learning-sessions/:id - Get session details
// PATCH /api/daily-learning-sessions/:id - End session

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Session ID is required',
        code: 'VALIDATION_ERROR',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { data: session, error } = await supabase
      .from('daily_learning_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      return new Response(
        JSON.stringify({
          error: 'Session not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get deck names
    const { data: decks } = await supabase
      .from('decks')
      .select('id, name')
      .in('id', session.deck_ids || []);

    return new Response(
      JSON.stringify({
        data: {
          session,
          decks: decks || [],
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/daily-learning-sessions/:id:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Session ID is required',
        code: 'VALIDATION_ERROR',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'end') {
      return new Response(
        JSON.stringify({
          error: 'Invalid action',
          code: 'VALIDATION_ERROR',
          details: { action: 'Must be "end"' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if session exists and is active
    const { data: existingSession, error: fetchError } = await supabase
      .from('daily_learning_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingSession) {
      return new Response(
        JSON.stringify({
          error: 'Session not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingSession.ended_at) {
      return new Response(
        JSON.stringify({
          error: 'Session already ended',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // End session
    const { data: session, error } = await supabase
      .from('daily_learning_sessions')
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !session) {
      console.error('Error ending session:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to end session',
          code: 'DATABASE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate duration
    const startedAt = new Date(session.started_at);
    const endedAt = new Date(session.ended_at);
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    return new Response(
      JSON.stringify({
        data: {
          ...session,
          duration_seconds: durationSeconds,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in PATCH /api/daily-learning-sessions/:id:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
