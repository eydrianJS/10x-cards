import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerClient } from '../../../db/supabase.server';

// Validation schemas
const createFlashcardSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  deckId: z.string().uuid(),
  creationMethod: z.enum(['ai', 'manual']).default('manual'),
  originalQuestion: z.string().optional(),
  originalAnswer: z.string().optional(),
  editPercentage: z.number().min(0).max(100).optional(),
});

const bulkCreateFlashcardsSchema = z.object({
  flashcards: z.array(createFlashcardSchema).min(1).max(20),
});

const updateFlashcardSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(2000).optional(),
});

const updateSM2Schema = z.object({
  quality: z.number().min(0).max(5),
});

export const GET: APIRoute = async ({ request, params, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
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
          }),
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
        }),
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
        }),
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
      }),
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
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();

    // Check if this is bulk create or single create
    const isBulkCreate = body.flashcards && Array.isArray(body.flashcards);

    if (isBulkCreate) {
      // Bulk create validation
      const validationResult = bulkCreateFlashcardsSchema.safeParse(body);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation failed',
            message: validationResult.error.issues.map((issue) => issue.message).join(', '),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const { flashcards } = validationResult.data;

      // Verify deck ownership for the first card (all should have same deck)
      const firstCard = flashcards[0];
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id')
        .eq('id', firstCard.deckId)
        .eq('user_id', user.id)
        .single();

      if (deckError || !deck) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Not found',
            message: 'Deck not found or access denied',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Prepare flashcards for insertion
      const flashcardsToInsert = flashcards.map((card) => ({
        question: card.question,
        answer: card.answer,
        deck_id: card.deckId,
        user_id: user.id,
        creation_method: card.creationMethod,
        original_question: card.originalQuestion,
        original_answer: card.originalAnswer,
        edit_percentage: card.editPercentage || 0,
        easiness_factor: 2.5,
        interval: 0,
        repetition_count: 0,
        next_review_date: new Date().toISOString(),
      }));

      // Bulk insert flashcards
      const { data: insertedCards, error } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Database error',
            message: 'Failed to create flashcards',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: insertedCards,
          message: `Created ${insertedCards.length} flashcards successfully`,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Single create validation
    const validationResult = createFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: validationResult.error.issues.map((issue) => issue.message).join(', '),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      question,
      answer,
      deckId,
      creationMethod,
      originalQuestion,
      originalAnswer,
      editPercentage,
    } = validationResult.data;

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
        }),
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
        original_question: originalQuestion,
        original_answer: originalAnswer,
        edit_percentage: editPercentage || 0,
        easiness_factor: 2.5,
        interval: 0,
        repetition_count: 0,
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
        }),
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
      }),
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
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
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
            message: validationResult.error.issues.map((issue) => issue.message).join(', '),
          }),
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
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Calculate new SM-2 values
      let { easiness_factor, interval, repetition_count } = currentCard;

      if (quality >= 3) {
        if (repetition_count === 0) {
          interval = 1;
        } else if (repetition_count === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easiness_factor);
        }
        repetition_count++;
      } else {
        repetition_count = 0;
        interval = 1;
      }

      easiness_factor = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easiness_factor = Math.max(1.3, easiness_factor);

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      // Update flashcard
      const { data: updatedCard, error: updateError } = await supabase
        .from('flashcards')
        .update({
          easiness_factor,
          interval,
          repetition_count,
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
          }),
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
        }),
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
          message: validationResult.error.issues.map((issue) => issue.message).join(', '),
        }),
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
        }),
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
      }),
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
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
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
        }),
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
        }),
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
      }),
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
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
