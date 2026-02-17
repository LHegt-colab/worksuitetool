import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Menu } from 'lucide-react';

interface NavbarProps {
    onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const { theme, setTheme } = useTheme();

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-muted focus:outline-none"
                    title="Open Menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
                {/* Breadcrumbs or Page Title could go here */}
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted focus:outline-none"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>
            </div>
        </header>
    );
}
