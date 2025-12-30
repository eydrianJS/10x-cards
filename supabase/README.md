# Supabase Configuration

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Project URL from Supabase Dashboard > Settings > API
SUPABASE_URL=https://buitjliaygmqzyrjreqm.supabase.co

# Publishable API Key (anon key) from Supabase Dashboard > Settings > API
SUPABASE_ANON_KEY=sb_publishable_WVnDnnczHkNerolMnbtNcg_rquwl1k8

# Service Role Key (secret key) from Supabase Dashboard > Settings > API
# ⚠️ Keep this secret! Never expose in client-side code
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: OpenAI API Key for Supabase AI features in Studio
OPENAI_API_KEY=your_openai_key_here
```

### 2. Link to Remote Project

To link your local Supabase CLI to the remote hosted project:

```bash
# Login to Supabase (opens browser)
npx supabase login

# Link to your project
npx supabase link --project-ref buitjliaygmqzyrjreqm
```

### 3. Database Migrations

Your existing migrations have been copied from `ai/migrations/` to `supabase/migrations/`.

To apply migrations to your remote database:

```bash
# Push migrations to remote
npx supabase db push

# Or pull remote schema to compare
npx supabase db pull
```

### 4. Local Development

To start Supabase locally with Docker:

```bash
# Start all Supabase services (requires Docker)
npx supabase start

# Stop services
npx supabase stop
```

This will start:
- PostgreSQL database on port 54322
- Studio (dashboard) on http://localhost:54323
- API on port 54321
- Auth, Realtime, Storage, and other services

### 5. Available Commands

```bash
# Check Supabase status
npx supabase status

# Generate TypeScript types from your database
npx supabase gen types typescript --local > src/types/database.ts

# Create a new migration
npx supabase migration new migration_name

# Reset local database
npx supabase db reset
```

## Project Structure

```
supabase/
├── config.toml          # Supabase configuration
├── migrations/          # Database migrations (SQL files)
│   ├── 000_full_migration.sql
│   ├── 001_create_enums.sql
│   ├── 002_create_tables.sql
│   ├── 003_create_functions.sql
│   ├── 004_create_indexes.sql
│   ├── 005_create_rls_policies.sql
│   └── 006_create_views.sql
└── seed.sql            # (optional) Seed data for local development
```

## Remote Project Info

- **Project URL**: https://buitjliaygmqzyrjreqm.supabase.co
- **Project Ref**: buitjliaygmqzyrjreqm
- **Dashboard**: https://supabase.com/dashboard/project/buitjliaygmqzyrjreqm

