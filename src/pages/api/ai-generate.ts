import { OpenRouter } from '@openrouter/sdk';
import type { APIRoute } from 'astro';
import { z } from 'zod';

// Request validation schema
const requestSchema = z.object({
  text: z.string().min(10).max(500),
  contentType: z
    .enum(['academic', 'technical', 'general', 'language'])
    .optional()
    .default('general'),
  maxCards: z.number().min(1).max(20).optional().default(10),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string().optional(),
});

// Content type specific prompt generators
const generatePrompt = (
  contentType: string,
  text: string,
  maxCards: number,
  sourceLanguage?: string,
  targetLanguage?: string
): string => {
  const prompts: Record<string, string> = {
    academic: `You are an expert educator creating study flashcards.

Create exactly ${maxCards} educational flashcards about the following topic:
"${text}"

Requirements:
- Focus on key concepts, definitions, theories, and important facts about this topic
- Questions should test understanding and knowledge retention
- Answers should be clear, accurate, and educational
- Return ONLY a valid JSON array with no additional text

Format: [{"question": "...", "answer": "..."}, ...]`,

    technical: `You are a technical expert creating study flashcards.

Create exactly ${maxCards} technical flashcards about the following topic:
"${text}"

Requirements:
- Focus on technical concepts, processes, tools, and best practices about this topic
- Questions should test practical knowledge and understanding
- Include real-world applications where relevant
- Answers should be precise and technically accurate
- Return ONLY a valid JSON array with no additional text

Format: [{"question": "...", "answer": "..."}, ...]`,

    general: `You are creating educational flashcards for general knowledge.

Create exactly ${maxCards} flashcards about the following topic:
"${text}"

Requirements:
- Cover important facts, concepts, and relationships about this topic
- Questions should be clear and straightforward
- Answers should be informative but concise
- Focus on the most important information
- Return ONLY a valid JSON array with no additional text

Format: [{"question": "...", "answer": "..."}, ...]`,

    language:
      sourceLanguage && targetLanguage
        ? `You are a language learning expert creating vocabulary flashcards from ${sourceLanguage} to ${targetLanguage}.

Create exactly ${maxCards} vocabulary flashcards for the following topic/context:
"${text}"

Requirements:
- Question: A word or short phrase in ${sourceLanguage} related to the topic
- Answer: Translation in ${targetLanguage} with a simple example sentence if helpful
- Focus on practical, commonly used vocabulary
- Return ONLY a valid JSON array with no additional text

Format: [{"question": "word in ${sourceLanguage}", "answer": "translation in ${targetLanguage} (example: ...)"}]`
        : `You are a language learning expert creating vocabulary flashcards.

Create exactly ${maxCards} language learning flashcards for the following topic/context:
"${text}"

Requirements:
- Focus on vocabulary, common phrases, and practical language usage related to this topic
- Questions should present words or phrases to learn
- Answers should provide translations, definitions, or usage examples
- Return ONLY a valid JSON array with no additional text

Format: [{"question": "...", "answer": "..."}, ...]`,
  };

  return prompts[contentType] || prompts.general;
};

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
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { text, contentType, maxCards, sourceLanguage, targetLanguage } = validationResult.data;

    // Get OpenRouter API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration error',
          message: 'AI service not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize OpenRouter client
    const openrouter = new OpenRouter({
      apiKey,
    });

    // Generate the appropriate prompt
    const prompt = generatePrompt(contentType, text, maxCards, sourceLanguage, targetLanguage);

    // Call OpenRouter API with Mistral Small Creative model
    let rawContent = '';
    try {
      const stream = await openrouter.chat.send({
        model: 'mistralai/devstral-2512:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
      });

      // Collect streamed response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          rawContent += content;
        }
      }

      if (!rawContent.trim()) {
        throw new Error('Empty response from AI service');
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service error',
          message: error instanceof Error ? error.message : 'Failed to generate flashcards',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to parse the JSON response
    let flashcards;
    try {
      // Sometimes AI wraps JSON in markdown code blocks, clean it up
      let jsonText = rawContent.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      flashcards = JSON.parse(jsonText);

      // Validate flashcards structure
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }

      if (flashcards.length === 0) {
        throw new Error('No flashcards generated');
      }

      // Validate each flashcard has required fields
      for (const card of flashcards) {
        if (
          !card.question ||
          !card.answer ||
          typeof card.question !== 'string' ||
          typeof card.answer !== 'string'
        ) {
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
        }),
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
      }),
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
        }),
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
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
