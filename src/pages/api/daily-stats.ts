import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../db/supabase.server';

// GET /api/daily-stats - Get daily statistics for the authenticated user
export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createSupabaseServerClient(cookies);

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get statistics from view
    const { data: stats, error: statsError } = await supabase
      .from('daily_statistics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      console.error('Error fetching daily statistics:', statsError);
      // Return default stats if view query fails
      return new Response(
        JSON.stringify({
          data: {
            cards_to_learn: 0,
            cards_in_progress: 0,
            cards_learned_total: 0,
            cards_learned_today: 0,
            cards_due_today: 0,
            study_days_last_month: 0,
            last_study_date: null,
            current_streak: 0,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate current streak using the database function
    const { data: streakData, error: streakError } = await supabase.rpc('calculate_study_streak', {
      p_user_id: user.id,
    });

    const currentStreak = streakError ? 0 : streakData || 0;

    // Get today's session if exists
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySession } = await supabase
      .from('daily_learning_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .is('ended_at', null)
      .single();

    return new Response(
      JSON.stringify({
        data: {
          cards_to_learn: stats?.cards_to_learn || 0,
          cards_in_progress: stats?.cards_in_progress || 0,
          cards_learned_total: stats?.cards_learned_total || 0,
          cards_learned_today: stats?.cards_learned_today || 0,
          cards_due_today: stats?.cards_due_today || 0,
          study_days_last_month: stats?.study_days_last_month || 0,
          last_study_date: stats?.last_study_date || null,
          current_streak: currentStreak,
          active_session: todaySession || null,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/daily-stats:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
