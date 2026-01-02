import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../db/supabase.server';

// GET /api/learning-lessons/:id - Get single learning lesson
// PATCH /api/learning-lessons/:id - Update learning lesson
// DELETE /api/learning-lessons/:id - Delete learning lesson

export const GET: APIRoute = async ({ params, cookies }) => {
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
        error: 'Lesson ID is required',
        code: 'VALIDATION_ERROR',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { data: lesson, error } = await supabase
      .from('learning_lessons')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !lesson) {
      return new Response(
        JSON.stringify({
          error: 'Learning lesson not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch deck names
    const { data: decks } = await supabase
      .from('decks')
      .select('id, name')
      .in('id', lesson.deck_ids || []);

    return new Response(
      JSON.stringify({
        data: {
          ...lesson,
          decks: decks || [],
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/learning-lessons/:id:', error);
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
        error: 'Lesson ID is required',
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
    const { name, description, deck_ids, daily_new_cards_limit } = body;

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Lesson name cannot be empty',
            code: 'VALIDATION_ERROR',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (deck_ids !== undefined) {
      if (!Array.isArray(deck_ids) || deck_ids.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'At least one deck is required',
            code: 'VALIDATION_ERROR',
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
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      updates.deck_ids = deck_ids;
    }

    if (daily_new_cards_limit !== undefined) {
      if (
        typeof daily_new_cards_limit !== 'number' ||
        daily_new_cards_limit < 1 ||
        daily_new_cards_limit > 100
      ) {
        return new Response(
          JSON.stringify({
            error: 'Daily new cards limit must be between 1 and 100',
            code: 'VALIDATION_ERROR',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      updates.daily_new_cards_limit = daily_new_cards_limit;
    }

    // Update lesson
    const { data: lesson, error } = await supabase
      .from('learning_lessons')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !lesson) {
      return new Response(
        JSON.stringify({
          error: 'Learning lesson not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch deck names
    const { data: decks } = await supabase
      .from('decks')
      .select('id, name')
      .in('id', lesson.deck_ids || []);

    return new Response(
      JSON.stringify({
        data: {
          ...lesson,
          decks: decks || [],
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in PATCH /api/learning-lessons/:id:', error);
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

export const DELETE: APIRoute = async ({ params, cookies }) => {
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
        error: 'Lesson ID is required',
        code: 'VALIDATION_ERROR',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { error } = await supabase
      .from('learning_lessons')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting learning lesson:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete learning lesson',
          code: 'DATABASE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error('Error in DELETE /api/learning-lessons/:id:', error);
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
