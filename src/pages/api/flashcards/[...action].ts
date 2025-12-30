import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, Flashcard as FlashcardType, CreateFlashcardForm } from '../../../shared/types';

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
const createFlashcardSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  deckId: z.string().uuid(),
  creationMethod: z.enum(['ai', 'manual']).default('manual'),
});

const updateFlashcardSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(2000).optional(),
});

const updateSM2Schema = z.object({
  quality: z.number().min(0).max(5),
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

export const GET: APIRoute = async ({ request, params }) => {
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

    const action = params.action?.[0];

    if (action === 'due') {
      // Get due flashcards for review
      const deckId = new URL(request.url).searchParams.get('deckId');

      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true });

      if (deckId) {
        query = query.eq('deck_id', deckId);
      }

      const { data: flashcards, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Database error',
            message: 'Failed to fetch due flashcards',
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
          data: flashcards,
          message: `Found ${flashcards.length} due flashcards`,
        } as ApiResponse<FlashcardType[]>),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all flashcards (with optional deck filter)
    const deckId = new URL(request.url).searchParams.get('deckId');

    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (deckId) {
      query = query.eq('deck_id', deckId);
    }

    const { data: flashcards, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to fetch flashcards',
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
        data: flashcards,
        message: `Found ${flashcards.length} flashcards`,
      } as ApiResponse<FlashcardType[]>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('GET flashcards error:', error);
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
    const validationResult = createFlashcardSchema.safeParse(body);

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

    const { question, answer, deckId, creationMethod } = validationResult.data;

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single();

    if (deckError || !deck) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Not found',
          message: 'Deck not found or access denied',
        } as ApiResponse<null>),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create flashcard
    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .insert({
        question,
        answer,
        deck_id: deckId,
        user_id: user.id,
        creation_method: creationMethod,
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to create flashcard',
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
        data: flashcard,
        message: 'Flashcard created successfully',
      } as ApiResponse<FlashcardType>),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('POST flashcard error:', error);
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

export const PUT: APIRoute = async ({ request, params }) => {
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

    const action = params.action?.[0];
    const body = await request.json();

    if (action === 'update-sm2') {
      // Update SM-2 algorithm
      const validationResult = updateSM2Schema.safeParse(body);

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

      const { id, quality } = body;

      // Get current flashcard
      const { data: currentCard, error: fetchError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !currentCard) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Not found',
            message: 'Flashcard not found',
          } as ApiResponse<null>),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Calculate new SM-2 values
      let { ease_factor, interval, repetitions } = currentCard;

      if (quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * ease_factor);
        }
        repetitions++;
      } else {
        repetitions = 0;
        interval = 1;
      }

      ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      ease_factor = Math.max(1.3, ease_factor);

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      // Update flashcard
      const { data: updatedCard, error: updateError } = await supabase
        .from('flashcards')
        .update({
          ease_factor,
          interval,
          repetitions,
          next_review_date: nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          quality,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database error:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Database error',
            message: 'Failed to update flashcard',
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
          data: updatedCard,
          message: 'Flashcard updated successfully',
        } as ApiResponse<FlashcardType>),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Regular flashcard update
    const { id, ...updates } = body;
    const validationResult = updateFlashcardSchema.safeParse(updates);

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

    const { data: updatedCard, error } = await supabase
      .from('flashcards')
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
          message: 'Failed to update flashcard',
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
        data: updatedCard,
        message: 'Flashcard updated successfully',
      } as ApiResponse<FlashcardType>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('PUT flashcard error:', error);
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

export const DELETE: APIRoute = async ({ request, params }) => {
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

    const action = params.action?.[0];
    const id = action;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bad request',
          message: 'Flashcard ID required',
        } as ApiResponse<null>),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: 'Failed to delete flashcard',
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
        message: 'Flashcard deleted successfully',
      } as ApiResponse<null>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('DELETE flashcard error:', error);
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
