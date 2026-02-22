import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import {
  LayoutDashboard,
  Map,
  MessageCircleQuestion,
  User,
  LogOut,
  Terminal,
  ChevronRight,
  Flame,
  Zap,
  Trophy,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/roadmaps', icon: Map, label: 'roadmaps' },
  { to: '/doubts', icon: MessageCircleQuestion, label: 'ask ai' },
  { to: '/profile', icon: User, label: 'profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { state: gam } = useGamification();
  const location = useLocation();

  const currentPage = navItems.find((item) => {
    if (item.to === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.to);
  });

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* ── Header Bar ── */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-border-primary bg-bg-secondary shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-accent-green" />
            <span className="text-text-bright font-semibold text-[15px] tracking-wide">
              study<span className="text-accent-green">platform</span>
            </span>
          </div>
          <span className="text-text-muted">|</span>
          <div className="flex items-center gap-1 text-text-secondary text-xs">
            <span>~</span>
            <ChevronRight size={10} />
            <span className="text-accent-blue">{currentPage?.label || 'unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {/* Gamification quick stats in header */}
          {gam && (
            <div className="flex items-center gap-3 mr-2">
              <span className="flex items-center gap-1 text-accent-green" title="XP">
                <Zap size={11} />
                <span className="text-[12px] font-medium">{gam.xp} XP</span>
              </span>
              <span className="flex items-center gap-1 text-accent-orange" title={`${gam.streak}-day streak`}>
                <Flame size={11} />
                <span className="text-[12px] font-medium">{gam.streak}</span>
              </span>
            </div>
          )}
          <span className="text-text-muted">
            {user?.username}@studyplatform
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-text-secondary hover:text-accent-red transition-colors cursor-pointer"
          >
            <LogOut size={12} />
            <span>exit</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <nav className="w-52 border-r border-border-primary bg-bg-secondary flex flex-col shrink-0">
          <div className="px-4 py-3 text-[12px] uppercase tracking-widest text-text-muted">
            navigation
          </div>
          <div className="flex-1 flex flex-col gap-1 px-2.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs rounded transition-colors ${isActive
                    ? 'bg-bg-active text-accent-green border-l-2 border-accent-green'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon size={14} />
                <span>{item.label}</span>

              </NavLink>
            ))}
          </div>

          {/* ── Gamification Widget in Sidebar ── */}
          {gam && (
            <div className="border-t border-border-primary px-4 py-4">
              <div className="text-[12px] uppercase tracking-wider text-text-muted mb-2">progress</div>

              {/* Level + XP bar */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-accent-green font-medium">lv.{gam.level}</span>
                  <span className="text-text-muted">{gam.xp}/{gam.xpForNextLevel} xp</span>
                </div>
                <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden border border-border-primary">
                  <div
                    className="h-full bg-gradient-to-r from-accent-green to-accent-cyan rounded-full transition-all duration-500"
                    style={{ width: `${gam.xpProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{gam.title}</div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1.5 text-[12px]">
                <Flame size={10} className={gam.streak > 0 ? 'text-accent-orange' : 'text-text-muted'} />
                <span className={gam.streak > 0 ? 'text-accent-orange' : 'text-text-muted'}>
                  {gam.streak} day streak
                </span>
              </div>

              {/* Badge count */}
              <div className="flex items-center gap-1.5 text-[12px] mt-1">
                <Trophy size={10} className="text-accent-purple" />
                <span className="text-text-secondary">
                  {gam.badges.filter((b) => b.earned).length}/{gam.badges.length} badges
                </span>
              </div>
            </div>
          )}

          {/* Sidebar footer */}
          <div className="border-t border-border-primary px-4 py-3">
            <div className="text-[12px] text-text-muted">
              <div>ai: nvidia glm5</div>
              <div>session: active</div>
            </div>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-auto bg-bg-primary">
          <Outlet />
        </main>
      </div>

      {/* ── Status Bar ── */}
      <footer className="flex items-center justify-between px-5 h-8 border-t border-border-primary bg-bg-secondary shrink-0 text-[12px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
            <span className="text-text-secondary">connected</span>
          </span>
          <span className="text-text-muted">
            {location.pathname}
          </span>
        </div>
        <div className="flex items-center gap-4 text-text-muted">
          {gam && (
            <span className="text-accent-green">
              lv.{gam.level} {gam.levelName}
            </span>
          )}
          <span>spring-boot:8080</span>
          <span>react:5173</span>
          <span>v3.0.0</span>
        </div>
      </footer>
    </div>
  );
}
