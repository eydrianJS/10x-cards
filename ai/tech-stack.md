# Tech Stack - AI-Powered Flashcard Learning Application

## Frontend - Astro + React

**Astro 5**

- Server-side rendering and static site generation
- File-based routing system
- Islands architecture for optimal performance
- API routes for secure backend operations

**React 19**

- Interactive UI components (islands)
- Client-side state management for flashcard review, deck management
- Used for highly interactive portions of the application

**TypeScript 5**

- Static typing for improved code quality
- Better IDE support and autocomplete
- Catch errors at compile time

**Tailwind CSS 4**

- Utility-first CSS framework
- Rapid UI development
- Consistent styling across components

**Shadcn/ui**

- Accessible React component library
- Pre-built UI components (buttons, forms, modals, etc.)
- Customizable with Tailwind CSS

---

## Backend - Supabase as Backend-as-a-Service

**Supabase PostgreSQL Database**

- Relational database for flashcards, decks, users, review history
- Row Level Security (RLS) for data privacy
- Real-time subscriptions (optional feature)

**Supabase Authentication**

- Built-in email/password authentication
- Session management
- Password reset functionality
- GDPR-compliant user data management

**Supabase SDK**

- JavaScript/TypeScript client library
- Seamless integration with React components
- Real-time data synchronization

**Astro API Routes** _(Security Layer)_

- Server-side endpoints for sensitive operations
- Proxy for OpenRouter AI calls (keeps API keys secure)
- Environment variable management
- Located in `src/pages/api/`

---

## AI Integration - OpenRouter.ai

**OpenRouter API**

- Access to multiple AI models (OpenAI, Anthropic, Google, etc.)
- Cost optimization through model selection
- API key spending limits and monitoring
- Flexible provider switching

**Integration Pattern**

- Accessed exclusively through Astro API routes (server-side)
- API keys stored in environment variables (never exposed to client)
- Request/response handling with error management
- Retry logic for failed requests

---

## CI/CD & Hosting

**GitHub Actions**

- Automated testing on push/pull requests
- Build verification
- Automated deployment pipeline
- Environment variable management

**DigitalOcean**

- Docker container hosting
- Ubuntu droplet deployment
- Nginx reverse proxy
- SSL/TLS certificate management

**Docker**

- Container orchestration
- Multi-stage builds for optimization
- Environment-based configuration
- Production-ready deployment

---

## Development Tools

**Version Control**

- Git for source control
- GitHub for repository hosting
- Feature branch workflow

**Package Management**

- npm or pnpm for dependency management
- Lock files for reproducible builds

**Code Quality**

- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- TypeScript compiler for type checking

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Astro Pages (SSR) + React Islands (CSR)           │ │
│  │  - Landing Page (Astro)                            │ │
│  │  - Dashboard (React Island)                        │ │
│  │  - Flashcard Review (React Island)                 │ │
│  │  - Deck Management (React Island)                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTPS
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Docker Container (DigitalOcean)             │
│  ┌────────────────────────────────────────────────────┐ │
│  │            Astro Application Server                │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │     Astro API Routes (Server-side)           │  │ │
│  │  │  - /api/ai-generate.ts (OpenRouter proxy)    │  │ │
│  │  │  - /api/flashcards/* (CRUD operations)       │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────┬───────────────────────┘
                  │               │
                  │               │
      ┌───────────▼─────┐   ┌────▼──────────┐
      │   Supabase      │   │  OpenRouter   │
      │   - PostgreSQL  │   │  AI API       │
      │   - Auth        │   │  (GPT/Claude) │
      │   - Storage     │   └───────────────┘
      └─────────────────┘
```

---

## Security Measures

**Authentication Security**

- Supabase managed authentication (bcrypt hashing)
- Session tokens with expiration
- HTTPS-only communication
- Password strength requirements

**API Security**

- API keys stored in environment variables
- Server-side API proxy (Astro routes)
- Rate limiting on AI generation
- Input validation and sanitization

**Data Security**

- Row Level Security (RLS) policies in Supabase
- User data isolation
- GDPR-compliant data deletion
- Encrypted data at rest (Supabase managed)

---

## Environment Variables

```bash
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter AI (Server-side only)
OPENROUTER_API_KEY=your_openrouter_api_key

# Application
NODE_ENV=production
PORT=4321
```

---

## Deployment Strategy

### Local Development

```bash
npm install
npm run dev
# App runs on http://localhost:4321
```

### Docker Build

```bash
docker build -t flashcard-app .
docker run -p 4321:4321 --env-file .env flashcard-app
```

### DigitalOcean Deployment

```bash
# On DigitalOcean Droplet
git pull origin main
docker-compose up -d --build
# Nginx reverse proxy handles SSL and routing
```

### CI/CD Pipeline (GitHub Actions)

1. Push to `main` branch
2. Run tests and linting
3. Build Docker image
4. Push to Docker registry (optional)
5. SSH to DigitalOcean droplet
6. Pull and restart containers

---

## Scalability Considerations

**Current Scale (MVP)**

- 10 concurrent users
- 5,000 flashcards per user
- Moderate AI API usage

**Growth Path**

- Supabase scales to thousands of users
- Docker containers can be replicated
- DigitalOcean droplets can be upgraded
- Consider Kubernetes for multi-container orchestration (future)
- CDN for static assets (future)

---

## Cost Estimation

| Service      | Free Tier             | Estimated Cost (MVP) |
| ------------ | --------------------- | -------------------- |
| Supabase     | Up to 500MB database  | $0                   |
| OpenRouter   | Pay-per-use           | $1-5/month           |
| DigitalOcean | N/A                   | $6-12/month          |
| GitHub       | Free for public repos | $0                   |
| **Total**    |                       | **~$10-20/month**    |

---

## Learning Objectives

This tech stack is designed to provide hands-on experience with:

1. **Astro Framework**

   - Islands architecture
   - SSR vs CSR trade-offs
   - API routes and server-side logic
   - React integration patterns

2. **Docker & DevOps**

   - Containerization best practices
   - Multi-stage Docker builds
   - Production deployment workflows
   - Environment management

3. **Full-stack Development**
   - Frontend + Backend integration
   - Authentication flows
   - Database design and RLS
   - API integration patterns

---

## Alternative Considerations (Evaluated but Not Selected)

**Why not pure React/Next.js?**

- Choosing Astro for learning purposes
- Desire to understand islands architecture
- Experience SSR in different framework

**Why not Vercel/Netlify?**

- Choosing Docker for learning containerization
- Understanding manual deployment processes
- Gaining DigitalOcean/VPS experience

**Why not other AI providers?**

- OpenRouter provides multi-model flexibility
- Cost controls through spending limits
- Easy model comparison

---

_Last Updated: December 27, 2025_
