import { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    subLabel?: string;
}

interface EntitySelectorProps {
    options: Option[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    label: string;
}

export function EntitySelector({ options, selectedIds, onChange, placeholder, label }: EntitySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.subLabel?.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

    return (
        <div className="relative space-y-2" ref={wrapperRef}>
            <label className="block text-sm font-medium text-foreground">{label}</label>

            <div className="flex flex-wrap gap-2 mb-2">
                {selectedOptions.map(opt => (
                    <span key={opt.id} className="inline-flex items-center gap-1 rounded-md bg-secondary/20 px-2 py-1 text-sm text-secondary-foreground border border-secondary/30">
                        {opt.label}
                        <button type="button" onClick={() => toggleSelection(opt.id)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder={selectedIds.length === 0 ? placeholder : "Add more..."}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    onFocus={() => setIsOpen(true)}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                />

                {isOpen && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md">
                        {filteredOptions.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">No results found.</p>
                        ) : (
                            filteredOptions.map(opt => {
                                const isSelected = selectedIds.includes(opt.id);
                                return (
                                    <div
                                        key={opt.id}
                                        className={`flex cursor-pointer items-center justify-between px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent/50' : ''}`}
                                        onClick={() => toggleSelection(opt.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span>{opt.label}</span>
                                            {opt.subLabel && <span className="text-xs text-muted-foreground">{opt.subLabel}</span>}
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 opacity-50" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
