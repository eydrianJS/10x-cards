# AI-Powered Flashcard Learning Application

An AI-powered web application that automatically generates high-quality flashcards from text input using OpenRouter AI, integrated with a proven spaced repetition algorithm (SM-2), enabling users to focus on learning rather than card creation.

## 🚀 Features

- **AI-Powered Flashcard Generation**: Automatically create flashcards from text input (max 500 chars)
- **SM-2 Spaced Repetition**: Proven algorithm for optimal review scheduling
- **Deck-Based Organization**: Organize flashcards by subject/topic
- **Manual Creation & Editing**: Full control over flashcard content
- **User Authentication**: Secure user accounts with Supabase Auth
- **Data Privacy**: GDPR-compliant with Row Level Security
- **Export Functionality**: CSV/JSON export capabilities
- **Responsive Design**: Works on mobile, tablet, and desktop

## 🛠 Tech Stack

- **Frontend**: Astro 5 + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 3 + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth) + Astro API Routes
- **AI**: OpenRouter.ai (access to multiple AI models)
- **Deployment**: Vercel (Serverless)
- **CI/CD**: Automatic deployments from GitHub

## 📋 Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account
- OpenRouter.ai API key
- Docker (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-flashcard-app
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter AI (Server-side only)
OPENROUTER_API_KEY=your_openrouter_api_key

# Application
NODE_ENV=development
PORT=4321
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in `supabase/migrations/`
3. Enable Row Level Security (RLS) policies

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:4321` to see the application.

### 5. Build for Production

```bash
npm run build
npm run preview
```

## 🚀 Deployment & CI/CD

### Automatyczny Deployment (Vercel)

Aplikacja deployuje się automatycznie na Vercel przy każdym push do `main`.

**Setup w 3 krokach:**

1. Import projektu na https://vercel.com (przez GitHub)
2. Dodaj Environment Variables (Supabase + OpenRouter keys)
3. Deploy! 🎉

📖 **Szczegóły**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Automatyczne Testy (GitHub Actions)

Każdy push i PR automatycznie uruchamia:

- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Unit tests + coverage
- ✅ Code formatting check
- ✅ Build verification

### Features

- ✅ Zero-config deployments z GitHub
- ✅ Preview deployments dla Pull Requests
- ✅ Darmowy hosting + HTTPS + CDN
- ✅ Web Analytics
- ✅ Automatyczne testy

## 📁 Project Structure

```
src/
├── domain/                 # Clean Architecture - Domain Layer
│   ├── entities/          # Domain entities (Flashcard, Deck, etc.)
│   ├── use-cases/         # Business logic
│   ├── interfaces/        # Ports/Interfaces
│   └── frameworks/        # External dependencies
├── shared/                # Shared utilities and types
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── stores/               # Zustand state management
├── components/           # React components
│   ├── ui/              # Shadcn/ui components
│   └── islands/         # Astro islands
├── pages/               # Astro pages and API routes
│   ├── api/            # Server-side API endpoints
│   └── ...             # Page routes
└── styles/             # Global styles
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Format code
npm run format
```

## 🚀 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Sign in existing user
- `POST /api/auth/logout` - Sign out current user

### AI Generation

- `POST /api/ai-generate` - Generate flashcards from text

### Flashcards

- `GET /api/flashcards/due` - Get due flashcards for review
- `GET /api/flashcards` - Get all flashcards
- `POST /api/flashcards` - Create new flashcard
- `PUT /api/flashcards/update-sm2` - Update SM-2 algorithm
- `PUT /api/flashcards` - Update flashcard content
- `DELETE /api/flashcards/:id` - Delete flashcard

### Decks

- `GET /api/decks` - Get user decks
- `POST /api/decks` - Create new deck
- `PUT /api/decks` - Update deck
- `DELETE /api/decks?id=:id` - Delete deck

## 🔒 Security

- **API Key Protection**: OpenRouter API keys never exposed to client
- **Authentication**: Supabase Auth with session management
- **Data Privacy**: Row Level Security (RLS) on all database tables
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Built into AI generation endpoint

## 📊 Performance

- **Page Load Target**: <2 seconds
- **Islands Architecture**: React components only where needed
- **Optimized Builds**: Multi-stage Docker builds
- **Caching**: Layer caching for faster deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Astro](https://astro.build/) - The web framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [OpenRouter](https://openrouter.ai/) - AI API access
- [SM-2 Algorithm](https://en.wikipedia.org/wiki/Spaced_repetition) - Spaced repetition research

---

**Target Users**: High school students and professionals preparing for exams and certifications.

**Scale**: Designed for 10 concurrent users with up to 5,000 flashcards per user.
