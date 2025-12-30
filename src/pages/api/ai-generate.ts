import type { APIRoute } from 'astro';
import { z } from 'zod';
import { AIGenerationRequest, AIGenerationResponse, ApiResponse } from '../../shared/types';

// Request validation schema
const requestSchema = z.object({
  text: z.string().min(10).max(500),
  contentType: z.enum(['academic', 'technical', 'general', 'language']).optional().default('general'),
  maxCards: z.number().min(1).max(20).optional().default(10),
});

// Content type specific prompts
const CONTENT_PROMPTS = {
  academic: `You are an expert educator creating flashcards for academic subjects. Create flashcards that focus on key concepts, definitions, theories, and important facts. Each flashcard should test understanding of fundamental principles.`,
  technical: `You are a technical expert creating flashcards for technical subjects. Create flashcards that focus on concepts, processes, tools, methodologies, and best practices. Include practical applications and real-world scenarios.`,
  general: `You are creating educational flashcards on general knowledge topics. Create flashcards that cover important facts, concepts, and relationships that help build comprehensive understanding.`,
  language: `You are a language learning expert creating flashcards for vocabulary and grammar. Create flashcards that focus on word meanings, usage contexts, grammatical structures, and practical communication.`,
};

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

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

    const { text, contentType, maxCards } = validationResult.data;

    // Get OpenRouter API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration error',
          message: 'AI service not configured',
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare AI prompt
    const prompt = `${CONTENT_PROMPTS[contentType]}

Create exactly ${maxCards} high-quality flashcards from the following text. Each flashcard must have a "question" and "answer" field.

Text to process:
${text}

Requirements:
- Questions should be clear, specific, and test understanding
- Answers should be comprehensive but concise
- Focus on the most important concepts from the text
- Use active recall principles (questions that require thinking, not just memorization)
- Return ONLY valid JSON array with no additional text or formatting

Format: [{"question": "...", "answer": "..."}, ...]`;

    // Call OpenRouter API with retry logic
    const aiResponse = await retryWithBackoff(async () => {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-flashcard-app.com',
          'X-Title': 'AI Flashcard Learning App',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku', // Cost-effective model
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.3, // Lower temperature for more consistent results
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      return response;
    }, 3, 1000);

    const aiData = await aiResponse.json();

    // Validate AI response
    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Invalid AI response structure:', aiData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI response error',
          message: 'Invalid response from AI service',
        } as ApiResponse<null>),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const rawContent = aiData.choices[0].message.content.trim();

    // Try to parse the JSON response
    let flashcards;
    try {
      flashcards = JSON.parse(rawContent);

      // Validate flashcards structure
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }

      if (flashcards.length === 0) {
        throw new Error('No flashcards generated');
      }

      // Validate each flashcard has required fields
      for (const card of flashcards) {
        if (!card.question || !card.answer || typeof card.question !== 'string' || typeof card.answer !== 'string') {
          throw new Error('Invalid flashcard structure');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', rawContent, parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI parsing error',
          message: 'Failed to parse AI response',
        } as ApiResponse<null>),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        data: { flashcards },
        message: `Successfully generated ${flashcards.length} flashcards`,
      } as ApiResponse<AIGenerationResponse>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('AI generation error:', error);

    // Handle different error types
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI generation failed',
          message: error.message,
        } as ApiResponse<null>),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
