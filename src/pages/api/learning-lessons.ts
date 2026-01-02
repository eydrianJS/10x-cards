import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../db/supabase.server';

// GET /api/learning-lessons - List all learning lessons for user
// POST /api/learning-lessons - Create new learning lesson
export const GET: APIRoute = async ({ request, cookies }) => {
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

  try {
    // Fetch all learning lessons for the user
    const { data: lessons, error } = await supabase
      .from('learning_lessons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching learning lessons:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch learning lessons',
          code: 'DATABASE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // For each lesson, get deck names
    const lessonsWithDecks = await Promise.all(
      (lessons || []).map(async (lesson: any) => {
        const { data: decks } = await supabase
          .from('decks')
          .select('id, name')
          .in('id', lesson.deck_ids || []);

        return {
          ...lesson,
          decks: decks || [],
        };
      })
    );

    return new Response(
      JSON.stringify({
        data: lessonsWithDecks,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/learning-lessons:', error);
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

export const POST: APIRoute = async ({ request, cookies }) => {
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

  try {
    const body = await request.json();
    const { name, description, deck_ids, daily_new_cards_limit } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Lesson name is required',
          code: 'VALIDATION_ERROR',
          details: { name: 'Name cannot be empty' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!deck_ids || !Array.isArray(deck_ids) || deck_ids.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'At least one deck is required',
          code: 'VALIDATION_ERROR',
          details: { deck_ids: 'Must include at least one deck' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify all decks belong to the user
    const { data: userDecks, error: decksError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .in('id', deck_ids);

    if (decksError || !userDecks || userDecks.length !== deck_ids.length) {
      return new Response(
        JSON.stringify({
          error: 'Invalid deck IDs',
          code: 'VALIDATION_ERROR',
          details: { deck_ids: 'Some decks do not exist or do not belong to you' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const limit = daily_new_cards_limit || 20;
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: 'Invalid daily new cards limit',
          code: 'VALIDATION_ERROR',
          details: { daily_new_cards_limit: 'Must be between 1 and 100' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create lesson
    const { data: lesson, error } = await supabase
      .from('learning_lessons')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        deck_ids,
        daily_new_cards_limit: limit,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating learning lesson:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to create learning lesson',
          code: 'DATABASE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch deck names
    const { data: decks } = await supabase
      .from('decks')
      .select('id, name')
      .in('id', lesson.deck_ids);

    return new Response(
      JSON.stringify({
        data: {
          ...lesson,
          decks: decks || [],
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in POST /api/learning-lessons:', error);
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
