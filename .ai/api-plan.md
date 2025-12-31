# REST API Plan

## AI-Powered Flashcard Learning Application

**Version:** 1.0  
**Date:** December 31, 2025  
**Status:** Draft

---

## 1. Resources

| Resource | Database Table/View | Description |
|----------|-------------------|-------------|
| Decks | `decks`, `deck_statistics` (view) | User's flashcard collections with statistics |
| Flashcards | `flashcards` | Individual flashcards with SM-2 data |
| Review Sessions | `review_sessions` | Study session tracking |
| Review History | `review_history` | Individual card review records |
| AI Generation | N/A (external API) | OpenRouter AI integration for flashcard generation |

---

## 2. Endpoints

### 2.1 Health Check

#### GET /api/health

Check API availability.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-31T12:00:00.000Z"
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Service is healthy |

---

### 2.2 Decks

#### GET /api/decks

List all decks for the authenticated user with statistics.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | `created_at` | Sort field: `name`, `created_at`, `updated_at`, `due_cards` |
| `order` | string | No | `desc` | Sort order: `asc`, `desc` |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Biology 101",
      "description": "Cell biology fundamentals",
      "total_cards": 45,
      "due_cards": 12,
      "created_at": "2025-12-30T10:00:00.000Z",
      "updated_at": "2025-12-30T15:30:00.000Z"
    }
  ]
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized - Invalid or missing session |

---

#### POST /api/decks

Create a new deck.

**Request Body:**

```json
{
  "name": "Biology 101",
  "description": "Cell biology fundamentals"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 characters, unique per user |
| `description` | string | No | Text, nullable |

**Response (201):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Biology 101",
    "description": "Cell biology fundamentals",
    "total_cards": 0,
    "due_cards": 0,
    "created_at": "2025-12-31T12:00:00.000Z",
    "updated_at": "2025-12-31T12:00:00.000Z"
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 201 | Deck created successfully |
| 400 | Validation error (empty name, name too long) |
| 401 | Unauthorized |
| 409 | Conflict - Deck with this name already exists |

---

#### GET /api/decks/:id

Get a single deck by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Deck ID |

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Biology 101",
    "description": "Cell biology fundamentals",
    "total_cards": 45,
    "due_cards": 12,
    "created_at": "2025-12-30T10:00:00.000Z",
    "updated_at": "2025-12-30T15:30:00.000Z"
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 404 | Deck not found |

---

#### PATCH /api/decks/:id

Update a deck.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Deck ID |

**Request Body:**

```json
{
  "name": "Biology 102",
  "description": "Advanced cell biology"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | 1-100 characters, unique per user |
| `description` | string | No | Text, nullable |

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Biology 102",
    "description": "Advanced cell biology",
    "total_cards": 45,
    "due_cards": 12,
    "created_at": "2025-12-30T10:00:00.000Z",
    "updated_at": "2025-12-31T12:00:00.000Z"
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Deck updated successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Deck not found |
| 409 | Conflict - Deck with this name already exists |

---

#### DELETE /api/decks/:id

Delete a deck and all associated flashcards.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Deck ID |

**Response (204):** No content

| Status Code | Description |
|-------------|-------------|
| 204 | Deck deleted successfully |
| 401 | Unauthorized |
| 404 | Deck not found |

---

#### GET /api/decks/:id/export

Export deck flashcards to CSV or JSON format.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Deck ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | Export format: `csv`, `json` |

**Response (200 - JSON format):**

```json
{
  "deck": {
    "id": "uuid",
    "name": "Biology 101",
    "description": "Cell biology fundamentals",
    "exported_at": "2025-12-31T12:00:00.000Z"
  },
  "flashcards": [
    {
      "question": "What is the powerhouse of the cell?",
      "answer": "Mitochondria",
      "due_date": "2025-12-31",
      "easiness_factor": 2.5,
      "repetition_count": 3,
      "interval": 6
    }
  ]
}
```

**Response (200 - CSV format):**

Returns CSV file with headers:
`question,answer,due_date,easiness_factor,repetition_count,interval`

| Status Code | Description |
|-------------|-------------|
| 200 | Export successful |
| 400 | Invalid format parameter |
| 401 | Unauthorized |
| 404 | Deck not found |

---

### 2.3 Flashcards

#### GET /api/decks/:deckId/flashcards

List all flashcards in a deck.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deckId` | uuid | Deck ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search in question and answer (ILIKE) |
| `due_only` | boolean | No | `false` | Filter to only due cards |
| `sort` | string | No | `created_at` | Sort field: `created_at`, `next_review_date`, `question` |
| `order` | string | No | `desc` | Sort order: `asc`, `desc` |
| `page` | number | No | `1` | Page number (1-indexed) |
| `limit` | number | No | `50` | Items per page (max 100) |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "question": "What is the powerhouse of the cell?",
      "answer": "Mitochondria",
      "creation_method": "ai",
      "easiness_factor": 2.5,
      "repetition_count": 0,
      "interval": 0,
      "next_review_date": "2025-12-31",
      "created_at": "2025-12-30T10:00:00.000Z",
      "updated_at": "2025-12-30T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "total_pages": 1
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 404 | Deck not found |

---

#### POST /api/decks/:deckId/flashcards

Create one or more flashcards in a deck.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deckId` | uuid | Deck ID |

**Request Body (Single card):**

```json
{
  "question": "What is the powerhouse of the cell?",
  "answer": "Mitochondria",
  "creation_method": "manual"
}
```

**Request Body (Multiple cards - typically from AI generation):**

```json
{
  "flashcards": [
    {
      "question": "What is the powerhouse of the cell?",
      "answer": "Mitochondria",
      "creation_method": "ai",
      "original_question": "What is the powerhouse of the cell?",
      "original_answer": "Mitochondria",
      "edit_percentage": 0
    },
    {
      "question": "What organelle contains genetic material?",
      "answer": "The nucleus contains DNA and controls cell activities.",
      "creation_method": "ai",
      "original_question": "What organelle contains genetic material?",
      "original_answer": "Nucleus",
      "edit_percentage": 45.5
    }
  ]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `question` | string | Yes | Non-empty after trim |
| `answer` | string | Yes | Non-empty after trim |
| `creation_method` | string | Yes | `ai` or `manual` |
| `original_question` | string | If AI | Required when creation_method is `ai` |
| `original_answer` | string | If AI | Required when creation_method is `ai` |
| `edit_percentage` | number | No | 0-100, calculated for AI cards |

**Response (201):**

```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "question": "What is the powerhouse of the cell?",
      "answer": "Mitochondria",
      "creation_method": "ai",
      "easiness_factor": 2.5,
      "repetition_count": 0,
      "interval": 0,
      "next_review_date": "2025-12-31",
      "created_at": "2025-12-31T12:00:00.000Z",
      "updated_at": "2025-12-31T12:00:00.000Z"
    }
  ],
  "created_count": 1
}
```

| Status Code | Description |
|-------------|-------------|
| 201 | Flashcard(s) created successfully |
| 400 | Validation error (empty question/answer, invalid creation_method) |
| 401 | Unauthorized |
| 404 | Deck not found |
| 409 | Conflict - User has reached 5000 flashcard limit |

---

#### GET /api/flashcards/:id

Get a single flashcard by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Flashcard ID |

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "question": "What is the powerhouse of the cell?",
    "answer": "Mitochondria",
    "creation_method": "ai",
    "original_question": "What is the powerhouse of the cell?",
    "original_answer": "Mitochondria",
    "edit_percentage": 0,
    "easiness_factor": 2.5,
    "repetition_count": 0,
    "interval": 0,
    "next_review_date": "2025-12-31",
    "created_at": "2025-12-30T10:00:00.000Z",
    "updated_at": "2025-12-30T10:00:00.000Z"
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 404 | Flashcard not found |

---

#### PATCH /api/flashcards/:id

Update a flashcard.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Flashcard ID |

**Request Body:**

```json
{
  "question": "What organelle is known as the powerhouse of the cell?",
  "answer": "Mitochondria - responsible for ATP production",
  "deck_id": "uuid"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `question` | string | No | Non-empty after trim |
| `answer` | string | No | Non-empty after trim |
| `deck_id` | uuid | No | For moving between decks; must belong to user |

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "question": "What organelle is known as the powerhouse of the cell?",
    "answer": "Mitochondria - responsible for ATP production",
    "creation_method": "ai",
    "edit_percentage": 25.5,
    "easiness_factor": 2.5,
    "repetition_count": 3,
    "interval": 6,
    "next_review_date": "2026-01-06",
    "created_at": "2025-12-30T10:00:00.000Z",
    "updated_at": "2025-12-31T12:00:00.000Z"
  }
}
```

**Note:** When editing an AI-generated flashcard, `edit_percentage` is recalculated based on the difference from `original_question` and `original_answer`.

| Status Code | Description |
|-------------|-------------|
| 200 | Flashcard updated successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Flashcard not found |
| 404 | Target deck not found (when moving) |

---

#### DELETE /api/flashcards/:id

Delete a flashcard.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Flashcard ID |

**Response (204):** No content

| Status Code | Description |
|-------------|-------------|
| 204 | Flashcard deleted successfully |
| 401 | Unauthorized |
| 404 | Flashcard not found |

---

### 2.4 AI Generation

#### POST /api/ai-generate

Generate flashcards from text using OpenRouter AI. Returns preview data without saving to database.

**Request Body:**

```json
{
  "text": "Mitochondria are membrane-bound organelles found in the cytoplasm of eukaryotic cells. They are often called the powerhouse of the cell because they generate most of the cell's supply of ATP.",
  "content_type": "academic",
  "count": 5
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `text` | string | Yes | 1-500 characters |
| `content_type` | string | No | `academic`, `technical`, `general`, `language` |
| `count` | number | No | 1-20, defaults to auto-detect |

**Response (200):**

```json
{
  "data": {
    "flashcards": [
      {
        "question": "What is the primary function of mitochondria?",
        "answer": "To generate ATP, the cell's main energy source."
      },
      {
        "question": "Where are mitochondria located in the cell?",
        "answer": "In the cytoplasm of eukaryotic cells."
      }
    ],
    "generated_count": 2,
    "content_type": "academic"
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Flashcards generated successfully |
| 400 | Validation error (empty text, text too long, invalid count) |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 500 | AI service error |
| 503 | AI service unavailable |

---

### 2.5 Review Sessions

#### POST /api/decks/:deckId/study

Start or resume a review session for a deck.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deckId` | uuid | Deck ID |

**Response (200 - Existing active session):**

```json
{
  "data": {
    "session": {
      "id": "uuid",
      "deck_id": "uuid",
      "started_at": "2025-12-31T10:00:00.000Z",
      "ended_at": null,
      "cards_reviewed": 5
    },
    "due_cards": [
      {
        "id": "uuid",
        "question": "What is the powerhouse of the cell?",
        "answer": "Mitochondria",
        "next_review_date": "2025-12-30"
      }
    ],
    "total_due": 12,
    "is_resumed": true
  }
}
```

**Response (201 - New session):**

```json
{
  "data": {
    "session": {
      "id": "uuid",
      "deck_id": "uuid",
      "started_at": "2025-12-31T12:00:00.000Z",
      "ended_at": null,
      "cards_reviewed": 0
    },
    "due_cards": [
      {
        "id": "uuid",
        "question": "What is the powerhouse of the cell?",
        "answer": "Mitochondria",
        "next_review_date": "2025-12-30"
      }
    ],
    "total_due": 12,
    "is_resumed": false
  }
}
```

**Note:** Due cards are ordered by `next_review_date` ASC (oldest first).

| Status Code | Description |
|-------------|-------------|
| 200 | Existing active session resumed |
| 201 | New session started |
| 200 | No cards due (returns empty due_cards array) |
| 401 | Unauthorized |
| 404 | Deck not found |

---

#### GET /api/review-sessions/:id

Get session details with remaining due cards.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID |

**Response (200):**

```json
{
  "data": {
    "session": {
      "id": "uuid",
      "deck_id": "uuid",
      "started_at": "2025-12-31T10:00:00.000Z",
      "ended_at": null,
      "cards_reviewed": 5
    },
    "due_cards": [
      {
        "id": "uuid",
        "question": "What organelle contains genetic material?",
        "answer": "The nucleus contains DNA.",
        "next_review_date": "2025-12-31"
      }
    ],
    "total_due": 7
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 404 | Session not found |

---

#### PATCH /api/review-sessions/:id

End a review session.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID |

**Request Body:**

```json
{
  "action": "end"
}
```

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "started_at": "2025-12-31T10:00:00.000Z",
    "ended_at": "2025-12-31T10:30:00.000Z",
    "cards_reviewed": 12,
    "duration_seconds": 1800
  }
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Session ended successfully |
| 400 | Session already ended |
| 401 | Unauthorized |
| 404 | Session not found |

---

#### POST /api/review-sessions/:sessionId/review

Submit a review for a flashcard. Applies SM-2 algorithm and updates flashcard scheduling.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | uuid | Session ID |

**Request Body:**

```json
{
  "flashcard_id": "uuid",
  "rating": "good"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `flashcard_id` | uuid | Yes | Must belong to session's deck |
| `rating` | string | Yes | `again`, `hard`, `good`, `easy` |

**Response (200):**

```json
{
  "data": {
    "flashcard": {
      "id": "uuid",
      "easiness_factor": 2.5,
      "repetition_count": 4,
      "interval": 15,
      "next_review_date": "2026-01-15"
    },
    "review": {
      "id": "uuid",
      "rating": "good",
      "reviewed_at": "2025-12-31T10:15:00.000Z"
    },
    "session": {
      "cards_reviewed": 6
    }
  }
}
```

**SM-2 Algorithm Implementation:**

| Rating | Effect |
|--------|--------|
| `again` | Reset: n=0, interval=1, EF -= 0.2 (min 1.3) |
| `hard` | interval *= 1.2, EF -= 0.15 |
| `good` | Standard SM-2: if n=0 → I=1, if n=1 → I=6, else I=I*EF |
| `easy` | interval *= 1.3, EF += 0.15 |

| Status Code | Description |
|-------------|-------------|
| 200 | Review submitted successfully |
| 400 | Invalid rating value |
| 400 | Flashcard does not belong to session's deck |
| 400 | Session has ended |
| 401 | Unauthorized |
| 404 | Session not found |
| 404 | Flashcard not found |

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Authentication** with JWT tokens. Authentication is handled client-side using the Supabase SDK.

**Session Management:**
- Sessions are maintained via Supabase's built-in session handling
- JWT tokens are automatically refreshed
- Session timeout: 30 days of inactivity

**Authentication Flow:**

1. User authenticates via Supabase client SDK (`supabase.auth.signInWithPassword()`)
2. Supabase returns access token and refresh token
3. Client includes access token in requests via cookie or Authorization header
4. API routes validate session via `supabase.auth.getUser()`

### 3.2 API Route Authentication

All API routes (except `/api/health`) require authentication.

**Middleware Implementation (Astro):**

```typescript
// Verify session in API routes
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3.3 Authorization (Row Level Security)

Data access is controlled by Supabase RLS policies:

| Table | Policy |
|-------|--------|
| `decks` | All operations: `user_id = auth.uid()` |
| `flashcards` | All operations: `user_id = auth.uid()` |
| `review_sessions` | All operations: `user_id = auth.uid()` |
| `review_history` | SELECT/INSERT via session ownership |

### 3.4 Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Cookie` | Yes* | Contains `sb-access-token` from Supabase |
| `Authorization` | Yes* | `Bearer <access_token>` alternative to cookie |
| `Content-Type` | For POST/PATCH | `application/json` |

*One of Cookie or Authorization is required.

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Decks

| Field | Validation |
|-------|------------|
| `name` | Required, 1-100 characters, trimmed, unique per user |
| `description` | Optional, text |

**Error Responses:**

```json
{
  "error": "Validation failed",
  "details": {
    "name": "Deck name is required"
  }
}
```

```json
{
  "error": "Deck with this name already exists",
  "code": "DUPLICATE_NAME"
}
```

#### Flashcards

| Field | Validation |
|-------|------------|
| `question` | Required, non-empty after trim |
| `answer` | Required, non-empty after trim |
| `creation_method` | Required, must be `ai` or `manual` |
| `original_question` | Required if `creation_method` is `ai` |
| `original_answer` | Required if `creation_method` is `ai` |
| `deck_id` | Must exist and belong to user |

**Limit Validation:**
- Maximum 5000 flashcards per user (enforced by database trigger)

**Error Response:**

```json
{
  "error": "Flashcard limit reached",
  "code": "LIMIT_EXCEEDED",
  "details": {
    "current": 5000,
    "limit": 5000
  }
}
```

#### AI Generation

| Field | Validation |
|-------|------------|
| `text` | Required, 1-500 characters |
| `content_type` | Optional, one of: `academic`, `technical`, `general`, `language` |
| `count` | Optional, 1-20 |

#### Reviews

| Field | Validation |
|-------|------------|
| `flashcard_id` | Required, must belong to session's deck |
| `rating` | Required, one of: `again`, `hard`, `good`, `easy` |

### 4.2 Business Logic Implementation

#### SM-2 Algorithm (POST /api/review-sessions/:sessionId/review)

```typescript
function calculateSM2(
  rating: 'again' | 'hard' | 'good' | 'easy',
  currentEF: number,
  currentN: number,
  currentInterval: number
): { ef: number; n: number; interval: number; nextReviewDate: Date } {
  let ef = currentEF;
  let n = currentN;
  let interval = currentInterval;

  switch (rating) {
    case 'again':
      n = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
      break;
    case 'hard':
      interval = Math.ceil(interval * 1.2);
      ef = Math.max(1.3, ef - 0.15);
      break;
    case 'good':
      if (n === 0) interval = 1;
      else if (n === 1) interval = 6;
      else interval = Math.ceil(interval * ef);
      n += 1;
      break;
    case 'easy':
      if (n === 0) interval = 1;
      else if (n === 1) interval = 6;
      else interval = Math.ceil(interval * ef);
      interval = Math.ceil(interval * 1.3);
      ef += 0.15;
      n += 1;
      break;
  }

  const nextReviewDate = addDays(new Date(), interval);
  return { ef, n, interval, nextReviewDate };
}
```

#### Edit Percentage Calculation (POST/PATCH flashcards)

For AI-generated flashcards, calculate the edit percentage using character-level diff:

```typescript
function calculateEditPercentage(
  original: string,
  edited: string
): number {
  const originalLength = original.length;
  const levenshteinDistance = calculateLevenshtein(original, edited);
  const percentage = (levenshteinDistance / originalLength) * 100;
  return Math.min(100, Math.round(percentage * 100) / 100);
}

// Combined edit percentage for question and answer
function calculateTotalEditPercentage(
  originalQ: string, editedQ: string,
  originalA: string, editedA: string
): number {
  const qEdit = calculateEditPercentage(originalQ, editedQ);
  const aEdit = calculateEditPercentage(originalA, editedA);
  return (qEdit + aEdit) / 2;
}
```

#### Active Session Management (POST /api/decks/:deckId/study)

```typescript
// Check for existing active session
const activeSession = await supabase
  .from('review_sessions')
  .select('*')
  .eq('deck_id', deckId)
  .eq('user_id', userId)
  .is('ended_at', null)
  .single();

if (activeSession.data) {
  // Resume existing session
  return { session: activeSession.data, is_resumed: true };
}

// Create new session
const newSession = await supabase
  .from('review_sessions')
  .insert({ deck_id: deckId, user_id: userId })
  .select()
  .single();

return { session: newSession.data, is_resumed: false };
```

#### Due Cards Query

```typescript
const dueCards = await supabase
  .from('flashcards')
  .select('id, question, answer, next_review_date')
  .eq('deck_id', deckId)
  .lte('next_review_date', new Date().toISOString().split('T')[0])
  .order('next_review_date', { ascending: true });
```

### 4.3 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/ai-generate` | 10 requests | per minute |
| All other endpoints | 100 requests | per minute |

**Rate Limit Response (429):**

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retry_after": 45
}
```

### 4.4 Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

**Standard Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User doesn't have access to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `DUPLICATE_NAME` | 409 | Unique constraint violation |
| `LIMIT_EXCEEDED` | 409 | User has reached resource limit |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 500 | OpenRouter API error |
| `AI_SERVICE_UNAVAILABLE` | 503 | OpenRouter API unavailable |

---

## 5. Implementation Notes

### 5.1 Astro API Route Structure

```
src/pages/api/
├── health.ts
├── ai-generate.ts
├── decks/
│   ├── index.ts          # GET (list), POST (create)
│   └── [id]/
│       ├── index.ts      # GET, PATCH, DELETE
│       ├── export.ts     # GET
│       ├── study.ts      # POST
│       └── flashcards/
│           └── index.ts  # GET, POST
├── flashcards/
│   └── [id].ts           # GET, PATCH, DELETE
└── review-sessions/
    └── [id]/
        ├── index.ts      # GET, PATCH
        └── review.ts     # POST
```

### 5.2 Supabase Client Usage

API routes should create authenticated Supabase clients using the request cookies:

```typescript
import { createServerClient } from '@supabase/ssr';

export async function GET({ request, cookies }: APIContext) {
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies.get(key)?.value;
        },
      },
    }
  );
  
  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Use supabase client for queries (RLS automatically applies)
}
```

### 5.3 OpenRouter Integration

```typescript
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function generateFlashcards(text: string, contentType: string, count?: number) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': import.meta.env.SITE_URL,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: getPromptForContentType(contentType)
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  
  // Parse and validate response
}
```

---

_Last Updated: December 31, 2025_

