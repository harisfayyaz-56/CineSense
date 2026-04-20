/**
 * Header Component
 * 
 * Navigation header with user profile menu that appears on every page.
 * Sticky positioned to remain visible during page scrolling.
 * 
 * Features:
 * - CineSense branding and logo with gradient styling
 * - Main navigation items: Home, Search, Watchlist, Ratings, Feedback
 * - User profile menu with logout option
 * - Responsive design (full nav on desktop, icon-only on mobile)
 * - Click-outside detection to close user menu
 * - Active page highlighting for current navigation item
 * 
 * State Management:
 * - showUserMenu: Boolean controlling visibility of profile dropdown
 * - menuRef: Reference to user menu container for click-outside detection
 * - Uses useEffect to attach/remove click listener for accessibility
 * 
 * Props:
 * - currentPage: Current active page (used for nav highlighting)
 * - onNavigate: Callback to change pages
 * - userName: Currently logged-in user's display name
 * - onLogout: Callback when user clicks logout button
 * 
 * User Menu Behavior:
 * - Displays user's display name or "User" if not provided
 * - Shows "Profile" and "Logout" options
 * - Closes automatically when clicking outside the menu
 * - Closes when user navigates to another page
 */

import { Film, Search, Home, User, LogOut, Heart, Star, MessageSquare, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userName?: string;
  onLogout?: () => void;
}

export function Header({ currentPage, onNavigate, userName, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "personal-dashboard", label: "My Dashboard", icon: Sparkles },
    { id: "search", label: "Search", icon: Search },
    { id: "watchlist", label: "Watchlist", icon: Heart },
    { id: "ratings", label: "My Ratings", icon: Star },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-md bg-zinc-950/95">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo - Larger */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2.5 rounded-lg">
              <Film className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CineSense</h1>
              <p className="text-xs text-zinc-400 leading-tight">Intelligent Recommendations</p>
            </div>
          </button>

          {/* Navigation - Centered with smaller font */}
          <nav className="flex items-center gap-3 flex-1 justify-center flex-wrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-base font-medium ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4 flex-shrink-0" ref={menuRef}>
            <div className="hidden md:block text-right border-r border-zinc-800 pr-4">
              <p className="text-sm font-medium text-white">{userName || "User"}</p>
              <p className="text-xs text-zinc-500">Member</p>
            </div>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2.5 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
            >
              <User className="w-6 h-6 text-white" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute top-full right-6 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-800 transition-colors text-sm"
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-600/10 transition-colors border-t border-zinc-800 text-sm"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}