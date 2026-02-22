import type {
  GamificationState,
  GamificationData,
  Badge,
  XPGain,
  RoadmapResponse,
  LearningInsights,
} from '../types';
import { LEVEL_THRESHOLDS, XP_REWARDS } from '../types';

const STORAGE_KEY_PREFIX = 'studyplatform_gamification_';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

// ── Persistence ──

export function loadGamificationData(userId: string): GamificationData {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) return JSON.parse(stored);
  } catch {
    // corrupt data, reset
  }
  return {
    xp: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    badgesEarned: [],
    xpHistory: [],
  };
}

export function saveGamificationData(data: GamificationData, userId: string): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}

// ── Level Calculation ──

export function getLevelInfo(xp: number) {
  type LevelEntry = (typeof LEVEL_THRESHOLDS)[number];
  let current: LevelEntry = LEVEL_THRESHOLDS[0];
  let next: LevelEntry = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const xpInLevel = xp - current.xp;
  const xpNeeded = next.xp - current.xp;
  const progress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;

  return {
    level: current.level,
    levelName: current.name,
    title: current.title,
    xpForCurrentLevel: current.xp,
    xpForNextLevel: next.xp,
    xpProgress: Math.round(progress),
  };
}

// ── Streak Calculation ──

export function calculateStreak(data: GamificationData): {
  streak: number;
  longestStreak: number;
  updated: boolean;
} {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (data.lastActiveDate === today) {
    // Already logged in today
    return { streak: data.streak, longestStreak: data.longestStreak, updated: false };
  }

  if (data.lastActiveDate === yesterday) {
    // Streak continues
    const newStreak = data.streak + 1;
    const longest = Math.max(newStreak, data.longestStreak);
    return { streak: newStreak, longestStreak: longest, updated: true };
  }

  if (!data.lastActiveDate) {
    // First time
    return { streak: 1, longestStreak: 1, updated: true };
  }

  // Streak broken
  return { streak: 1, longestStreak: data.longestStreak, updated: true };
}

// ── Badge Definitions ──

export function buildBadges(
  data: GamificationData,
  roadmaps: RoadmapResponse[],
  insights: LearningInsights | null,
): Badge[] {
  const completedTopics = roadmaps.reduce((sum, r) => sum + (r.completedTopics || 0), 0);
  const activeRoadmaps = roadmaps.filter((r) => r.status === 'ACTIVE').length;
  const completedRoadmaps = roadmaps.filter((r) => r.status === 'COMPLETED').length;
  const doubtsAsked = insights?.doubtCount || 0;

  const badges: Badge[] = [
    {
      id: 'first_roadmap',
      name: 'Pathfinder',
      description: 'Create your first roadmap',
      icon: 'Map',
      color: 'text-accent-blue',
      category: 'learning',
      requirement: 1,
      current: Math.min(roadmaps.length, 1),
      earned: roadmaps.length >= 1,
      earnedAt: data.badgesEarned.includes('first_roadmap') ? data.lastActiveDate : null,
      progress: roadmaps.length >= 1 ? 100 : 0,
    },
    {
      id: 'five_roadmaps',
      name: 'Cartographer',
      description: 'Create 5 roadmaps',
      icon: 'Map',
      color: 'text-accent-purple',
      category: 'exploration',
      requirement: 5,
      current: Math.min(roadmaps.length, 5),
      earned: roadmaps.length >= 5,
      earnedAt: data.badgesEarned.includes('five_roadmaps') ? data.lastActiveDate : null,
      progress: Math.min(100, (roadmaps.length / 5) * 100),
    },
    {
      id: 'topic_starter',
      name: 'Topic Starter',
      description: 'Complete 5 topics',
      icon: 'BookOpen',
      color: 'text-accent-green',
      category: 'learning',
      requirement: 5,
      current: Math.min(completedTopics, 5),
      earned: completedTopics >= 5,
      earnedAt: data.badgesEarned.includes('topic_starter') ? data.lastActiveDate : null,
      progress: Math.min(100, (completedTopics / 5) * 100),
    },
    {
      id: 'topic_crusher',
      name: 'Topic Crusher',
      description: 'Complete 25 topics',
      icon: 'Zap',
      color: 'text-accent-orange',
      category: 'mastery',
      requirement: 25,
      current: Math.min(completedTopics, 25),
      earned: completedTopics >= 25,
      earnedAt: data.badgesEarned.includes('topic_crusher') ? data.lastActiveDate : null,
      progress: Math.min(100, (completedTopics / 25) * 100),
    },
    {
      id: 'curious_mind',
      name: 'Curious Mind',
      description: 'Ask 10 doubts',
      icon: 'MessageCircleQuestion',
      color: 'text-accent-cyan',
      category: 'exploration',
      requirement: 10,
      current: Math.min(doubtsAsked, 10),
      earned: doubtsAsked >= 10,
      earnedAt: data.badgesEarned.includes('curious_mind') ? data.lastActiveDate : null,
      progress: Math.min(100, (doubtsAsked / 10) * 100),
    },
    {
      id: 'streak_week',
      name: 'Streak Warrior',
      description: '7-day login streak',
      icon: 'Flame',
      color: 'text-accent-orange',
      category: 'streak',
      requirement: 7,
      current: Math.min(data.streak, 7),
      earned: data.longestStreak >= 7,
      earnedAt: data.badgesEarned.includes('streak_week') ? data.lastActiveDate : null,
      progress: Math.min(100, (data.streak / 7) * 100),
    },
    {
      id: 'streak_month',
      name: 'Streak Legend',
      description: '30-day login streak',
      icon: 'Flame',
      color: 'text-accent-red',
      category: 'streak',
      requirement: 30,
      current: Math.min(data.streak, 30),
      earned: data.longestStreak >= 30,
      earnedAt: data.badgesEarned.includes('streak_month') ? data.lastActiveDate : null,
      progress: Math.min(100, (data.streak / 30) * 100),
    },
    {
      id: 'multi_active',
      name: 'Multi-Tasker',
      description: 'Have 3 active roadmaps',
      icon: 'Layers',
      color: 'text-accent-purple',
      category: 'exploration',
      requirement: 3,
      current: Math.min(activeRoadmaps, 3),
      earned: activeRoadmaps >= 3,
      earnedAt: data.badgesEarned.includes('multi_active') ? data.lastActiveDate : null,
      progress: Math.min(100, (activeRoadmaps / 3) * 100),
    },
    {
      id: 'completionist',
      name: 'Completionist',
      description: 'Complete a roadmap',
      icon: 'Trophy',
      color: 'text-accent-orange',
      category: 'mastery',
      requirement: 1,
      current: Math.min(completedRoadmaps, 1),
      earned: completedRoadmaps >= 1,
      earnedAt: data.badgesEarned.includes('completionist') ? data.lastActiveDate : null,
      progress: completedRoadmaps >= 1 ? 100 : 0,
    },
    {
      id: 'level_5',
      name: 'Scholar',
      description: 'Reach level 5',
      icon: 'Star',
      color: 'text-accent-cyan',
      category: 'mastery',
      requirement: 5,
      current: Math.min(getLevelInfo(data.xp).level, 5),
      earned: getLevelInfo(data.xp).level >= 5,
      earnedAt: data.badgesEarned.includes('level_5') ? data.lastActiveDate : null,
      progress: Math.min(100, (getLevelInfo(data.xp).level / 5) * 100),
    },
  ];

  return badges;
}

// ── XP Operations ──

export function addXP(
  data: GamificationData,
  amount: number,
  reason: string,
): GamificationData {
  const gain: XPGain = {
    amount,
    reason,
    timestamp: new Date().toISOString(),
  };

  return {
    ...data,
    xp: data.xp + amount,
    xpHistory: [gain, ...data.xpHistory].slice(0, 50), // keep last 50
  };
}

// ── Sync with API data ──
// Recalculates XP from actual platform activity to prevent drift

export function syncXPFromActivity(
  data: GamificationData,
  roadmaps: RoadmapResponse[],
  insights: LearningInsights | null,
): GamificationData {
  const completedTopics = roadmaps.reduce((sum, r) => sum + (r.completedTopics || 0), 0);
  const startedRoadmaps = roadmaps.filter((r) => r.status !== 'DRAFT').length;
  const doubtsAsked = insights?.doubtCount || 0;

  // Calculate what XP should be based on actual activity
  const activityXP =
    roadmaps.length * XP_REWARDS.CREATE_ROADMAP +
    startedRoadmaps * XP_REWARDS.START_ROADMAP +
    completedTopics * XP_REWARDS.COMPLETE_TOPIC +
    doubtsAsked * XP_REWARDS.ASK_DOUBT;

  // Streak bonuses (these are stored locally)
  const streakXP = data.xp - activityXP;

  // If actual activity XP exceeds stored XP, update
  // This prevents XP from going down if user had streak bonuses
  const totalXP = Math.max(data.xp, activityXP + Math.max(0, streakXP));

  return {
    ...data,
    xp: totalXP,
  };
}

// ── Full State Builder ──

export function buildGamificationState(
  data: GamificationData,
  roadmaps: RoadmapResponse[],
  insights: LearningInsights | null,
  userId: string,
): GamificationState {
  const levelInfo = getLevelInfo(data.xp);
  const badges = buildBadges(data, roadmaps, insights);

  // Auto-mark newly earned badges
  const today = new Date().toISOString().split('T')[0];
  const newlyEarned = badges
    .filter((b) => b.earned && !data.badgesEarned.includes(b.id))
    .map((b) => b.id);

  if (newlyEarned.length > 0) {
    data.badgesEarned = [...data.badgesEarned, ...newlyEarned];
    saveGamificationData(data, userId);
  }

  return {
    xp: data.xp,
    level: levelInfo.level,
    levelName: levelInfo.levelName,
    xpForCurrentLevel: levelInfo.xpForCurrentLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    xpProgress: levelInfo.xpProgress,
    streak: data.streak,
    longestStreak: data.longestStreak,
    lastActiveDate: data.lastActiveDate || today,
    badges,
    recentXPGains: data.xpHistory.slice(0, 10),
    title: levelInfo.title,
  };
}

// ── Daily Login Handler ──

export function handleDailyLogin(data: GamificationData): GamificationData {
  const streakResult = calculateStreak(data);
  const today = new Date().toISOString().split('T')[0];

  if (!streakResult.updated) {
    return data; // Already handled today
  }

  let updated: GamificationData = {
    ...data,
    streak: streakResult.streak,
    longestStreak: streakResult.longestStreak,
    lastActiveDate: today,
  };

  // Daily login XP
  updated = addXP(updated, XP_REWARDS.DAILY_LOGIN, 'Daily login');

  // Streak milestones
  if (streakResult.streak === 7) {
    updated = addXP(updated, XP_REWARDS.STREAK_BONUS_7, '7-day streak bonus!');
  }
  if (streakResult.streak === 30) {
    updated = addXP(updated, XP_REWARDS.STREAK_BONUS_30, '30-day streak bonus!');
  }

  return updated;
}
