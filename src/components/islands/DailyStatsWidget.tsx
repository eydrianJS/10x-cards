import { useEffect, useState } from 'react';
import { Card } from '../ui/card';

interface DailyStats {
  cards_to_learn: number;
  cards_in_progress: number;
  cards_learned_total: number;
  cards_learned_today: number;
  cards_due_today: number;
  study_days_last_month: number;
  last_study_date: string | null;
  current_streak: number;
  active_session: any | null;
}

export default function DailyStatsWidget() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/daily-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">Loading statistics...</div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">{error || 'Failed to load statistics'}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.cards_to_learn}</div>
            <div className="text-sm text-gray-600 mt-1">To Learn</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.cards_in_progress}</div>
            <div className="text-sm text-gray-600 mt-1">Learning</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.cards_learned_today}</div>
            <div className="text-sm text-gray-600 mt-1">Learned Today</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.cards_due_today}</div>
            <div className="text-sm text-gray-600 mt-1">Due Today</div>
          </div>
        </Card>
      </div>

      {/* Streak & Progress */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-4xl">🔥</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.current_streak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-4xl">📚</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.cards_learned_total}</div>
            <div className="text-sm text-gray-600">Total Learned</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-4xl">📅</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.study_days_last_month}</div>
            <div className="text-sm text-gray-600">Days This Month</div>
          </div>
        </div>
      </Card>

      {/* Active Session Alert */}
      {stats.active_session && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="font-semibold text-blue-900">Active Session</div>
                <div className="text-sm text-blue-700">
                  {stats.active_session.cards_studied} cards studied so far
                </div>
              </div>
            </div>
            <a
              href="/daily-learning"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Continue
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
