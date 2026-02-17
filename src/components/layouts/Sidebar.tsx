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

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { signOut } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-card border-r border-border transition-transform duration-300 md:static md:translate-x-0 md:transform-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center px-6 border-b border-border">
                    <h1 className="text-xl font-bold text-primary">WorkSuite</h1>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-4">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={() => onClose()} // Close menu on navigation
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
        </>
    );
}
