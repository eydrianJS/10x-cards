# Test Suite Documentation

Comprehensive test suite for the AI-Powered Flashcard Learning Application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [TBD Tests](#tbd-tests)
- [CI/CD Integration](#cicd-integration)

---

## Overview

This test suite provides comprehensive coverage of all application functionality, including:

- **Unit Tests**: Domain entities, business logic, utilities
- **Integration Tests**: API endpoints, authentication, database operations
- **Component Tests**: React components and islands (TBD)
- **E2E Tests**: Full user workflows (TBD)

### Test Framework

- **Jest**: Test runner and assertion library
- **TypeScript**: Type-safe tests
- **ts-jest**: TypeScript transformation for Jest

---

## Test Structure

```
tests/
├── setup.ts                          # Global test setup
├── helpers/                          # Test utilities and helpers
│   ├── auth-helper.ts               # Authentication helpers
│   ├── api-client.ts                # API test client
│   └── test-data.ts                 # Test data factories
├── unit/                             # Unit tests
│   ├── domain/
│   │   └── entities/
│   │       ├── Flashcard.test.ts    # SM-2 algorithm tests
│   │       └── Deck.test.ts         # Deck entity tests
│   └── shared/
│       └── utils/
│           ├── sm2-calculator.test.ts     # SM-2 pure function tests
│           └── edit-percentage.test.ts    # Edit calculation tests
└── integration/                      # Integration tests
    └── api/
        ├── health.test.ts           # Health check endpoint
        ├── auth.test.ts             # Authentication flows
        ├── decks.test.ts            # Deck CRUD operations
        ├── flashcards.test.ts       # Flashcard operations
        ├── review-sessions.test.ts  # Review and SM-2 integration
        ├── ai-generate.test.ts      # AI generation
        └── daily-learning.test.ts   # Daily learning system
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Specific Test File

```bash
npm test -- Flashcard.test.ts
```

### Specific Test Suite

```bash
npm test -- --testNamePattern="SM-2 Algorithm"
```

### Coverage Report

```bash
npm test -- --coverage
```

### Integration Tests Only

```bash
npm test -- tests/integration
```

### Unit Tests Only

```bash
npm test -- tests/unit
```

---

## Test Coverage

### Functional Requirements Coverage

#### Authentication (FR-AUTH-001 to FR-AUTH-012)

- ✅ User registration validation
- ✅ Login/logout flows
- ⏳ Password reset (TBD)
- ⏳ Account deletion (TBD)
- ⏳ GDPR compliance (TBD)

#### Deck Management (FR-DECK-001 to FR-DECK-010)

- ✅ Deck entity business logic
- ✅ CRUD operations
- ⏳ Statistics updates (TBD)
- ⏳ Data export (TBD)

#### AI Generation (FR-AI-001 to FR-AI-021)

- ✅ Request validation
- ✅ Content type selection
- ✅ Character limits
- ⏳ Actual AI integration (TBD - requires API key)
- ⏳ Analytics tracking (TBD)

#### Manual Flashcards (FR-MANUAL-001 to FR-MANUAL-012)

- ✅ Flashcard creation validation
- ✅ Content editing
- ⏳ Deck reassignment (TBD)
- ⏳ Search/filter (TBD)

#### Spaced Repetition (FR-SR-001 to FR-SR-019)

- ✅ SM-2 algorithm implementation
- ✅ All rating types (Again, Hard, Good, Easy)
- ✅ EF constraints
- ✅ Interval calculation
- ⏳ Session management (TBD)
- ⏳ Review history tracking (TBD)

#### Data Export (FR-EXPORT-001 to FR-EXPORT-006)

- ⏳ CSV export (TBD)
- ⏳ JSON export (TBD)

### Code Coverage Goals

- **Target**: 80% overall coverage
- **Critical paths**: 100% coverage (SM-2 algorithm, authentication)
- **Current**: Run `npm test -- --coverage` to see current metrics

---

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*.test.ts` (in `integration/` folder)
- Place tests near related code or in appropriate test folder

### Test Structure

```typescript
describe('Feature Name', () => {
  // Setup
  beforeAll(async () => {
    // One-time setup
  });

  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  afterAll(async () => {
    // One-time cleanup
  });

  describe('Specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Using Test Helpers

```typescript
import { createAuthHelper } from '../helpers/auth-helper';
import { createTestClient } from '../helpers/api-client';
import { generateTestDeck, TEST_USERS } from '../helpers/test-data';

describe('My API Test', () => {
  it('should create deck', async () => {
    const authHelper = createAuthHelper();
    await authHelper.createAndLoginTestUser();

    const client = createTestClient(undefined, authHelper.getAuthCookie());
    const deckData = generateTestDeck();

    const response = await client.createDeck(deckData);
    expect(response.status).toBe(201);

    await authHelper.cleanup();
  });
});
```

### Marking Tests as TBD

Use `.skip` for tests that require unimplemented features:

```typescript
describe('Feature (FR-XXX-XXX)', () => {
  it.skip('should do something not yet implemented', async () => {
    // TBD: Requires feature implementation
    // Test code here
  });
});
```

---

## TBD Tests

Tests marked as TBD require one or more of the following:

### Infrastructure Requirements

- ✅ Jest configuration
- ⏳ **Supabase test database**: Local or test instance
- ⏳ **OpenRouter API key**: For AI generation tests
- ⏳ **Authentication setup**: Working auth system
- ⏳ **Test database seeding**: Sample data for integration tests

### Feature Implementation Requirements

1. **Authentication System**
   - Email/password authentication
   - Session management
   - Password reset
   - Account deletion

2. **Database Integration**
   - Supabase RLS policies
   - Row-level security
   - Cascade deletes

3. **API Endpoints**
   - All CRUD operations
   - Review session management
   - Analytics tracking

4. **External Services**
   - OpenRouter AI integration
   - Email service (for verification, password reset)

### Running TBD Tests

To run tests marked as TBD (will be skipped):

```bash
npm test -- --listTests
```

To temporarily enable TBD tests (will likely fail):

```typescript
// Change .skip to .only
describe.only('Feature', () => {
  it.skip('test', () => {
    /* ... */
  });
});
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Push to `main` branch
- Pull requests
- Manual workflow dispatch

### Test Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run lint
```

### Pre-commit Hooks

Run tests before committing:

```bash
# .husky/pre-commit
npm test
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good - isolated
it('should create deck', async () => {
  const deck = await createDeck({ name: 'Test' });
  expect(deck).toBeDefined();
  await deleteDeck(deck.id);
});

// ❌ Bad - dependent
let globalDeck;
it('should create deck', async () => {
  globalDeck = await createDeck({ name: 'Test' });
});
it('should update deck', async () => {
  await updateDeck(globalDeck.id, { name: 'Updated' });
});
```

### 2. Clear Test Names

```typescript
// ✅ Good - descriptive
it('should reject password shorter than 8 characters', () => {});

// ❌ Bad - vague
it('should validate password', () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should calculate SM-2 correctly', () => {
  // Arrange
  const flashcard = createFlashcard({ easeFactor: 2.5 });

  // Act
  const updated = flashcard.applySM2Algorithm(3);

  // Assert
  expect(updated.easeFactor).toBeGreaterThan(2.0);
});
```

### 4. Test Edge Cases

```typescript
describe('calculateEditPercentage', () => {
  it('should handle empty strings', () => {});
  it('should handle identical strings', () => {});
  it('should handle very long strings', () => {});
  it('should handle unicode characters', () => {});
});
```

### 5. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('@openrouter/sdk');

// Mock Supabase
jest.mock('../db/supabase.client');
```

---

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="should calculate SM-2"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

### Show All Test Names

```bash
npm test -- --listTests
```

---

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Mark tests as `.skip` if dependencies aren't ready
3. Add comment explaining what's needed: `// TBD: Requires X`
4. Update this README with coverage info
5. Ensure all tests pass before submitting PR

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [PRD - Flashcard App](.ai/PRD-Flashcard-App.md)
- [API Plan](.ai/api-plan.md)

---

Last Updated: January 2, 2025
