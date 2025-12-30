import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, Deck as DeckType, CreateDeckForm } from '../../shared/types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Validation schemas
const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

const updateDeckSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// Helper function to get user from session
async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<null>),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's decks and count flashcards in each
    const { data: decks, error } = await supabase
      .from('decks')
      .select(`
        *,
        flashcards:flashcards(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to fetch decks',
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Transform data to include flashcard count
    const decksWithCounts = decks.map(deck => ({
      ...deck,
      flashcardCount: Array.isArray(deck.flashcards) ? deck.flashcards.length : 0,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: decksWithCounts,
        message: `Found ${decksWithCounts.length} decks`,
      } as ApiResponse<DeckType[]>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('GET decks error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      } as ApiResponse<null>),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<null>),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const validationResult = createDeckSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: validationResult.error.issues.map(issue => issue.message).join(', '),
        } as ApiResponse<null>),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { name, description, isPublic } = validationResult.data;

    // Create deck
    const { data: deck, error } = await supabase
      .from('decks')
      .insert({
        name,
        description,
        is_public: isPublic,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to create deck',
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { ...deck, flashcardCount: 0 },
        message: 'Deck created successfully',
      } as ApiResponse<DeckType>),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('POST deck error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      } as ApiResponse<null>),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<null>),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;
    const validationResult = updateDeckSchema.safeParse(updates);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: validationResult.error.issues.map(issue => issue.message).join(', '),
        } as ApiResponse<null>),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: updatedDeck, error } = await supabase
      .from('decks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to update deck',
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedDeck,
        message: 'Deck updated successfully',
      } as ApiResponse<DeckType>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('PUT deck error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      } as ApiResponse<null>),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<null>),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bad request',
          message: 'Deck ID required',
        } as ApiResponse<null>),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if deck has flashcards
    const { data: flashcards, error: checkError } = await supabase
      .from('flashcards')
      .select('id')
      .eq('deck_id', id)
      .eq('user_id', user.id)
      .limit(1);

    if (checkError) {
      console.error('Database error:', checkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to check deck contents',
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (flashcards && flashcards.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Conflict',
          message: 'Cannot delete deck with existing flashcards',
        } as ApiResponse<null>),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete deck
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to delete deck',
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: null,
        message: 'Deck deleted successfully',
      } as ApiResponse<null>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('DELETE deck error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      } as ApiResponse<null>),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
