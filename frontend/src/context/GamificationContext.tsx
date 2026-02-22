import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { GamificationState, RoadmapResponse, LearningInsights } from '../types';
import {
  loadGamificationData,
  saveGamificationData,
  handleDailyLogin,
  syncXPFromActivity,
  buildGamificationState,
  addXP,
} from '../lib/gamification';
import { XP_REWARDS } from '../types';
import { useAuth } from './AuthContext';
import { roadmapApi } from '../api/roadmaps';
import { doubtApi } from '../api/doubts';

interface GamificationContextType {
  state: GamificationState | null;
  loading: boolean;
  awardXP: (amount: number, reason: string) => void;
  awardAction: (action: keyof typeof XP_REWARDS) => void;
  refresh: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<GamificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<RoadmapResponse[]>([]);
  const [insights, setInsights] = useState<LearningInsights | null>(null);

  const userId = user?.id ?? '';

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setState(null);
      setLoading(false);
      return;
    }

    try {
      const [roadmapRes, insightsRes] = await Promise.all([
        roadmapApi.getAll(),
        doubtApi.getInsights(),
      ]);

      const rms = roadmapRes.data.success ? roadmapRes.data.data : [];
      const ins = insightsRes.data.success ? insightsRes.data.data : null;
      setRoadmaps(rms);
      setInsights(ins);

      // Load persisted data (scoped to this user)
      let data = loadGamificationData(userId);

      // Handle daily login streak
      data = handleDailyLogin(data);

      // Sync XP with actual activity
      data = syncXPFromActivity(data, rms, ins);

      // Save updated data (scoped to this user)
      saveGamificationData(data, userId);

      // Build full state
      const gamState = buildGamificationState(data, rms, ins, userId);
      setState(gamState);
    } catch {
      // If API fails, still show cached gamification data
      const data = loadGamificationData(userId);
      const gamState = buildGamificationState(data, [], null, userId);
      setState(gamState);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const awardXP = useCallback(
    (amount: number, reason: string) => {
      if (!userId) return;
      let data = loadGamificationData(userId);
      data = addXP(data, amount, reason);
      saveGamificationData(data, userId);
      const gamState = buildGamificationState(data, roadmaps, insights, userId);
      setState(gamState);
    },
    [roadmaps, insights, userId],
  );

  const awardAction = useCallback(
    (action: keyof typeof XP_REWARDS) => {
      const amount = XP_REWARDS[action];
      const reasonMap: Record<string, string> = {
        CREATE_ROADMAP: 'Created a roadmap',
        COMPLETE_TOPIC: 'Completed a topic',
        ASK_DOUBT: 'Asked a doubt',
        DAILY_LOGIN: 'Daily login',
        STREAK_BONUS_7: '7-day streak bonus',
        STREAK_BONUS_30: '30-day streak bonus',
        FIRST_ROADMAP: 'First roadmap bonus',
        START_ROADMAP: 'Started a roadmap',
        GENERATE_CONTENT: 'Generated AI content',
      };
      awardXP(amount, reasonMap[action] || action);
    },
    [awardXP],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  return (
    <GamificationContext.Provider value={{ state, loading, awardXP, awardAction, refresh }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
}
