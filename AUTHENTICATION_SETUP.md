# Authentication Setup Guide

## Overview

The authentication system has been successfully implemented using Supabase Auth. This guide covers what was created and how to use it.

## 🎯 What Was Implemented

### 1. **Environment Configuration**

- Updated to use `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- Added proper TypeScript types for environment variables
- Created both client-side and server-side Supabase clients

### 2. **API Routes** (`src/pages/api/auth/`)

#### `POST /api/auth/signup`

Register a new user with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {...}
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

#### `POST /api/auth/login`

Sign in an existing user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {...}
  },
  "message": "Login successful"
}
```

#### `POST /api/auth/logout`

Sign out the current user.

**Response (200):**

```json
{
  "message": "Logout successful"
}
```

### 3. **Pages**

#### Landing Page (`/`)

- Hero section with feature highlights
- CTA buttons for registration and login
- Automatically redirects authenticated users to dashboard

#### Login Page (`/login`)

- User-friendly login form
- Link to registration page
- Redirects authenticated users to dashboard

#### Register Page (`/register`)

- Registration form with validation
- Password strength requirements displayed
- Success message after registration
- Link to login page

#### Dashboard (`/dashboard`)

- Protected route (requires authentication)
- Welcome message with user email
- Logout button
- Placeholder for upcoming features

### 4. **React Components**

#### `AuthForm.tsx`

Reusable authentication form component for both login and registration:

- Mode prop: `'login'` or `'register'`
- Client-side validation
- Error handling and display
- Success messages
- Loading states

#### `LogoutButton.tsx`

Button component that handles user logout:

- Loading state during logout
- Redirects to home after successful logout

### 5. **Database Helpers**

#### `src/db/supabase.client.ts`

Client-side Supabase instance for browser operations:

- Uses public environment variables
- Handles client-side auth operations

#### `src/db/supabase.server.ts`

Server-side Supabase client factory:

- Creates authenticated clients for SSR
- Uses Astro cookies for session management
- Proper TypeScript typing with Database types

### 6. **Middleware** (`src/middleware/index.ts`)

- Creates server-side Supabase client for all requests
- Refreshes session automatically
- Makes Supabase client available to all pages via `Astro.locals`

## 🚀 Getting Started

### 1. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter AI (for future features)
OPENROUTER_API_KEY=your-openrouter-key
```

### 2. Configure Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Paste them into your `.env` file

### 3. Set Up Authentication in Supabase

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** provider
3. Configure email templates if desired
4. (Optional) Disable email confirmation for development:
   - Go to **Authentication** → **Settings**
   - Toggle off "Enable email confirmations"

### 4. Run the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Visit `http://localhost:4321`

## 🔐 Security Features

### Password Validation

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number

### Session Management

- Automatic session refresh via middleware
- 30-day session expiry (Supabase default)
- Secure cookie-based authentication

### Protected Routes

- Dashboard requires authentication
- Automatic redirects for unauthenticated users
- Automatic redirects to dashboard for authenticated users on auth pages

### API Security

- Server-side validation of all inputs
- Email format validation
- Password strength validation
- Error messages don't leak sensitive information

## 📱 User Flows

### Registration Flow

1. User clicks "Get Started" or "Sign Up"
2. Fills out registration form
3. System validates input
4. Creates account in Supabase
5. Shows success message
6. User can log in

### Login Flow

1. User clicks "Sign In"
2. Enters email and password
3. System authenticates with Supabase
4. Redirects to dashboard on success

### Logout Flow

1. User clicks "Logout" button
2. System calls logout API
3. Clears session
4. Redirects to home page

## 🧪 Testing the Authentication

### Manual Testing Steps

1. **Test Registration:**

   ```
   - Navigate to /register
   - Try registering with weak password (should fail)
   - Try registering with valid credentials (should succeed)
   - Check Supabase dashboard for new user
   ```

2. **Test Login:**

   ```
   - Navigate to /login
   - Try logging in with wrong password (should fail)
   - Try logging in with correct credentials (should succeed)
   - Should redirect to /dashboard
   ```

3. **Test Protected Routes:**

   ```
   - While logged out, try accessing /dashboard (should redirect to /login)
   - While logged in, try accessing /login (should redirect to /dashboard)
   ```

4. **Test Logout:**
   ```
   - While logged in, click Logout button
   - Should redirect to home page
   - Try accessing /dashboard (should redirect to /login)
   ```

## 🎨 UI Components Used

All components use Shadcn/ui for consistent styling:

- `Button` - Primary actions
- `Input` - Form fields
- `Card` - Content containers
- `CardHeader`, `CardTitle`, `CardDescription` - Card sections
- `CardContent`, `CardFooter` - Card layout

## 📁 File Structure

```
src/
├── db/
│   ├── supabase.client.ts          # Client-side Supabase
│   └── supabase.server.ts          # Server-side Supabase
├── pages/
│   ├── index.astro                  # Landing page
│   ├── login.astro                  # Login page
│   ├── register.astro               # Register page
│   ├── dashboard.astro              # Protected dashboard
│   └── api/
│       └── auth/
│           ├── signup.ts            # Registration API
│           ├── login.ts             # Login API
│           └── logout.ts            # Logout API
├── components/
│   └── islands/
│       ├── AuthForm.tsx             # Auth form component
│       └── LogoutButton.tsx         # Logout button
└── middleware/
    └── index.ts                     # Auth middleware
```

## 🔄 Next Steps

Now that authentication is working, you can:

1. **Implement Deck Management**
   - Create, read, update, delete decks
   - Associate decks with authenticated users

2. **Implement Flashcard CRUD**
   - Create flashcards in decks
   - View, edit, delete flashcards

3. **Implement AI Generation**
   - Connect to OpenRouter API
   - Generate flashcards from text

4. **Implement Spaced Repetition**
   - SM-2 algorithm
   - Review sessions
   - Progress tracking

## 🐛 Troubleshooting

### "Missing Supabase environment variables" error

- Make sure `.env` file exists
- Check that variable names are correct: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after changing `.env`

### "Invalid email or password" on login

- Check that user exists in Supabase dashboard
- Verify email confirmation status
- Try resetting password

### Redirects not working

- Check browser console for errors
- Verify Supabase session is being created
- Check that middleware is running

### TypeScript errors

- Run `npm run typecheck` to see detailed errors
- Make sure `@supabase/ssr` is installed
- Check that database types are generated

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Astro SSR Documentation](https://docs.astro.build/en/guides/server-side-rendering/)
- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [Project PRD](.ai/PRD-Flashcard-App.md)
- [API Plan](.ai/api-plan.md)

---

✅ **Authentication is now fully functional!** Users can register, login, and logout securely.
