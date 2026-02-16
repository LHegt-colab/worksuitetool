import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
    icon?: LucideIcon;
}

export default function PlaceholderPage({ title, icon: Icon }: PlaceholderPageProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
                {Icon ? <Icon className="h-12 w-12 text-muted-foreground" /> : <div className="h-12 w-12 bg-muted-foreground/20 rounded-full" />}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-md">
                This feature is currently under construction. Please check back later or start with the available modules.
            </p>
        </div>
    );
}
