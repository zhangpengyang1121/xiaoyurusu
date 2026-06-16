import { BlogUser } from '../clientApi';
import { ViewTab } from '../types';
import { PenTool, LogOut, LogIn, ChevronRight, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: BlogUser | null;
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  currentTab,
  onTabChange,
  onLogin,
  onLogout,
}: HeaderProps) {
  const isAdmin = user?.email === 'yinaiermei4431@outlook.com';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Brand / Logo */}
        <div 
          onClick={() => onTabChange('feed')}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
          id="web-logo"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white font-display font-medium text-sm shadow-sm">
            酥
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold tracking-tight text-gray-900">
              因爱而美小雨如酥生活美学馆
            </span>
            <span className="font-mono text-[9px] text-gray-400 -mt-0.5 tracking-wider uppercase">
              LIFESTYLE AESTHETICS MUSEUM
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('feed')}
            className={`font-sans text-sm font-medium transition-colors ${
              currentTab === 'feed' 
                ? 'text-gray-900' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="nav-home"
          >
            首页
          </button>

          {/* Admin Create post action */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('write')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-all ${
                currentTab === 'write'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              id="admin-write-btn"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>撰写新文章</span>
            </button>
          )}

          {/* Separator */}
          <div className="h-4 w-[1px] bg-gray-200" />

          {/* User profile / Login trigger */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-7 w-7 rounded-full border border-gray-100 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 font-mono text-xs font-semibold text-gray-600">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="hidden flex-col sm:flex">
                  <span className="font-sans text-xs font-semibold text-gray-800 -mb-0.5">
                    {user.displayName || '读者'}
                  </span>
                  {isAdmin && (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium tracking-wide text-amber-600 uppercase">
                      <Sparkles className="h-2 w-2 fill-amber-500 text-amber-500" /> Webmaster
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={onLogout}
                title="退出登录"
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-red-500"
                id="logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 font-sans text-xs font-semibold text-gray-700 shadow-2xs transition-all hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
              id="login-btn"
            >
              <LogIn className="h-3.5 w-3.5 text-gray-500" />
              <span>登录账户</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
