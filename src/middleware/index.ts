import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from '../db/supabase.server';

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase server client for SSR
  const supabase = createSupabaseServerClient(context.cookies);
  context.locals.supabase = supabase;

  // Refresh session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // You can add protected route logic here if needed
  // For now, we handle it on individual pages

  return next();
});
