import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    BookOpen,
    Clock,
    Users,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Agenda / Calendar', href: '/calendar', icon: Calendar },
    { name: 'Actions', href: '/actions', icon: CheckSquare },
    { name: 'Meetings', href: '/meetings', icon: Users },
    { name: 'Journal', href: '/journal', icon: BookOpen },
    { name: 'Knowledge', href: '/knowledge', icon: BookOpen }, // Using BookOpen for now, maybe finding a better one?
    { name: 'Time & Vacation', href: '/time', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const { signOut } = useAuth();

    return (
        <div className="flex h-full w-64 flex-col bg-card border-r border-border">
            <div className="flex h-16 items-center px-6 border-b border-border">
                <h1 className="text-xl font-bold text-primary">WorkSuite</h1>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-4">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )
                        }
                    >
                        <item.icon
                            className="mr-3 h-5 w-5 flex-shrink-0"
                            aria-hidden="true"
                        />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={() => signOut()}
                    className="group flex w-full items-center px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
