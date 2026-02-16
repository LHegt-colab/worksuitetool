import React from 'react';
import { Search, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();

    return (
        <header className="h-16 bg-card border-b border-border fixed top-0 right-0 left-64 z-10 px-6 flex items-center justify-between transition-colors duration-200">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search meetings, actions, journal..."
                        className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>

                {/* User Profile / Logout */}
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-medium text-text">{user?.email}</span>
                        <span className="text-xs text-text-muted">Pro User</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon className="h-4 w-4" />
                    </div>
                    <button
                        onClick={signOut}
                        className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-full transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
