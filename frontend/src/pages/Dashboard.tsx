import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { roadmapApi } from '../api/roadmaps';
import { doubtApi } from '../api/doubts';
import type { RoadmapResponse, LearningInsights } from '../types';
import {
  Map,
  MessageCircleQuestion,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Loader2,
  Plus,
  Zap,
  Flame,
  Trophy,
  Star,
  Target,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'text-text-muted',
  ACTIVE: 'text-accent-green',
  PAUSED: 'text-accent-orange',
  COMPLETED: 'text-accent-blue',
  ARCHIVED: 'text-text-muted',
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { state: gam } = useGamification();
  const [roadmaps, setRoadmaps] = useState<RoadmapResponse[]>([]);
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roadmapRes, insightsRes] = await Promise.all([
        roadmapApi.getAll(),
        doubtApi.getInsights(),
      ]);
      if (roadmapRes.data.success) setRoadmaps(roadmapRes.data.data);
      if (insightsRes.data.success) setInsights(insightsRes.data.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const activeRoadmaps = roadmaps.filter((r) => r.status === 'ACTIVE');
  const totalTopics = roadmaps.reduce((sum, r) => sum + (r.totalTopics || 0), 0);
  const completedTopics = roadmaps.reduce((sum, r) => sum + (r.completedTopics || 0), 0);
  const earnedBadges = gam?.badges.filter((b) => b.earned) || [];
  const nextBadge = gam?.badges.find((b) => !b.earned && b.progress > 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Loader2 size={14} className="spinner" />
          loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto fade-in">
      {/* Welcome */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
          <ChevronRight size={10} className="text-accent-green" />
          <span>~/{user?.username}/dashboard</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-bright">
              welcome back, <span className="text-accent-green">{profile?.fullName || user?.username}</span>
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* Level badge */}
          {gam && (
            <div className="flex items-center gap-3 px-4 py-2 border border-border-primary rounded bg-bg-secondary">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-green">{gam.level}</div>
                <div className="text-[11px] text-text-muted uppercase tracking-wider">level</div>
              </div>
              <div className="border-l border-border-primary pl-3">
                <div className="text-[12px] text-accent-green font-medium">{gam.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-16 h-1 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-green rounded-full"
                      style={{ width: `${gam.xpProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-text-muted">{gam.xp} XP</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Stats Row */}
      {gam && (
        <div className="grid grid-cols-4 gap-5 mb-8">
          {/* XP */}
          <div className="border border-border-primary rounded bg-bg-secondary p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-accent-green" />
              <span className="text-[12px] uppercase tracking-wider text-text-muted">total xp</span>
            </div>
            <div className="text-3xl font-bold text-accent-green">{gam.xp}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-green to-accent-cyan rounded-full"
                  style={{ width: `${gam.xpProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-text-muted">{gam.xpProgress}%</span>
            </div>
          </div>

          {/* Streak */}
          <div className="border border-border-primary rounded bg-bg-secondary p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className={gam.streak > 0 ? 'text-accent-orange' : 'text-text-muted'} />
              <span className="text-[12px] uppercase tracking-wider text-text-muted">streak</span>
            </div>
            <div className={`text-3xl font-bold ${gam.streak > 0 ? 'text-accent-orange' : 'text-text-muted'}`}>
              {gam.streak}
              <span className="text-xs font-normal text-text-muted ml-1">days</span>
            </div>
            <div className="flex gap-1 mt-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-sm ${i < Math.min(gam.streak, 7) ? 'bg-accent-orange' : 'bg-bg-primary'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="border border-border-primary rounded bg-bg-secondary p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-accent-purple" />
              <span className="text-[12px] uppercase tracking-wider text-text-muted">badges</span>
            </div>
            <div className="text-3xl font-bold text-accent-purple">
              {earnedBadges.length}
              <span className="text-xs font-normal text-text-muted ml-1">/{gam.badges.length}</span>
            </div>
            {nextBadge && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-purple/50 rounded-full"
                    style={{ width: `${nextBadge.progress}%` }}
                  />
                </div>
                <span className="text-[11px] text-text-muted truncate max-w-[60px]">{nextBadge.name}</span>
              </div>
            )}
          </div>

          {/* Level */}
          <div className="border border-border-primary rounded bg-bg-secondary p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-accent-cyan" />
              <span className="text-[12px] uppercase tracking-wider text-text-muted">level</span>
            </div>
            <div className="text-3xl font-bold text-accent-cyan">{gam.level}</div>
            <div className="text-[12px] text-accent-cyan mt-1">{gam.levelName}</div>
          </div>
        </div>
      )}

      {/* Learning Stats grid */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { icon: Map, label: 'roadmaps', value: roadmaps.length, color: 'text-accent-blue' },
          { icon: Target, label: 'active', value: activeRoadmaps.length, color: 'text-accent-green' },
          { icon: BookOpen, label: 'topics', value: `${completedTopics}/${totalTopics}`, color: 'text-accent-purple' },
          { icon: MessageCircleQuestion, label: 'doubts asked', value: insights?.doubtCount || 0, color: 'text-accent-orange' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-border-primary rounded bg-bg-secondary p-5"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[12px] uppercase tracking-wider text-text-muted">{stat.label}</span>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <Link
          to="/roadmaps?new=true"
          className="flex items-center gap-4 border border-border-primary rounded bg-bg-secondary p-6 hover:border-accent-green/50 hover:bg-bg-hover transition-colors group"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded bg-accent-dim-green">
            <Plus size={16} className="text-accent-green" />
          </div>
          <div>
            <div className="text-sm text-text-primary group-hover:text-accent-green transition-colors">
              new roadmap
            </div>
            <div className="text-[12px] text-text-muted mt-0.5">generate an AI learning path (+100 XP)</div>
          </div>
          <ChevronRight size={16} className="ml-auto text-text-muted group-hover:text-accent-green transition-colors" />
        </Link>

        <Link
          to="/doubts"
          className="flex items-center gap-4 border border-border-primary rounded bg-bg-secondary p-6 hover:border-accent-blue/50 hover:bg-bg-hover transition-colors group"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded bg-accent-dim-blue">
            <MessageCircleQuestion size={16} className="text-accent-blue" />
          </div>
          <div>
            <div className="text-sm text-text-primary group-hover:text-accent-blue transition-colors">
              ask a doubt
            </div>
            <div className="text-[12px] text-text-muted mt-0.5">get AI-powered answers (+25 XP)</div>
          </div>
          <ChevronRight size={16} className="ml-auto text-text-muted group-hover:text-accent-blue transition-colors" />
        </Link>
      </div>

      {/* Two-column: Recent Roadmaps + Recent XP */}
      <div className="grid grid-cols-3 gap-5">
        {/* Recent roadmaps (takes 2 cols) */}
        <div className="col-span-2 border border-border-primary rounded bg-bg-secondary">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-primary">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-accent-cyan" />
              <span className="text-sm font-medium text-text-primary">recent roadmaps</span>
            </div>
            <Link to="/roadmaps" className="text-[12px] text-accent-blue hover:underline">
              view all
            </Link>
          </div>

          {roadmaps.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-text-muted">no roadmaps yet</p>
              <p className="text-xs text-text-muted mt-1">
                create your first AI-generated learning roadmap
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-primary">
              {roadmaps.slice(0, 5).map((rm) => (
                <Link
                  key={rm.id}
                  to={`/roadmaps/${rm.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-hover transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary group-hover:text-accent-blue transition-colors truncate">
                      {rm.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[12px] text-text-muted">
                      <span className={statusColors[rm.status]}>
                        {rm.status.toLowerCase()}
                      </span>
                      <span>{rm.totalTopics || 0} topics</span>
                      <span>{rm.difficulty}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-28 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-green rounded-full transition-all"
                        style={{ width: `${rm.progressPercentage || 0}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-text-muted w-8 text-right">
                      {Math.round(rm.progressPercentage || 0)}%
                    </span>
                  </div>

                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-blue transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent XP gains (1 col) */}
        <div className="border border-border-primary rounded bg-bg-secondary">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border-primary">
            <Zap size={14} className="text-accent-green" />
            <span className="text-sm font-medium text-text-primary">xp activity</span>
          </div>

          {gam?.recentXPGains && gam.recentXPGains.length > 0 ? (
            <div className="divide-y divide-border-primary">
              {gam.recentXPGains.slice(0, 8).map((gain, i) => (
                <div key={i} className="px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-accent-green text-xs font-medium">+{gain.amount}</span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(gain.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[12px] text-text-secondary mt-0.5">{gain.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <Zap size={22} className="text-text-muted mx-auto mb-2" />
              <p className="text-[12px] text-text-muted">
                no xp yet — start learning!
              </p>
            </div>
          )}

          <Link
            to="/profile"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border-primary text-[12px] text-accent-blue hover:bg-bg-hover transition-colors"
          >
            view all achievements
            <ChevronRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
