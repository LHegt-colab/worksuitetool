import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    BookOpen,
    FileText,
    Settings,
    Search,
    Clock
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/meetings', label: 'Meetings', icon: Calendar },
    { path: '/actions', label: 'Actions', icon: CheckSquare },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/knowledge', label: 'Knowledge', icon: FileText },
    { path: '/time', label: 'Time & Vacation', icon: Clock },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-card border-r border-border h-full flex flex-col fixed inset-y-0 left-0 z-10 transition-colors duration-200">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <LayoutDashboard className="h-6 w-6" />
                    <span>WorkSuite</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border space-y-1">
                <NavLink
                    to="/labels"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text'
                        }`
                    }
                >
                    <Search className="h-5 w-5" />
                    Global Filter
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text'
                        }`
                    }
                >
                    <Settings className="h-5 w-5" />
                    Settings
                </NavLink>
            </div>
        </aside>
    );
}
