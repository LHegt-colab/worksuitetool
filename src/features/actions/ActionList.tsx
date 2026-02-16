import { useState, useEffect } from 'react';
import { actionsApi, type Action, type NewAction } from './api';
import { ActionForm } from './ActionForm';
import { Plus, Search, Filter, Calendar, Clock, CheckSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { tagsApi, type Tag } from '../tags/api';

export function ActionList() {
    const [actions, setActions] = useState<Action[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Action | undefined>(undefined);
    const { user } = useAuth();

    // Filtering state
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [actionsData, tagsData] = await Promise.all([
                actionsApi.getActions(),
                tagsApi.getTags()
            ]);
            setActions(actionsData);
            setTags(tagsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (data: NewAction) => {
        if (!user) return;
        await actionsApi.createAction({ ...data, user_id: user.id });
        loadData();
    };

    const handleUpdate = async (data: NewAction) => {
        if (!editingAction) return;
        await actionsApi.updateAction(editingAction.id, data);
        loadData();
        setEditingAction(undefined);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this action?')) {
            await actionsApi.deleteAction(id);
            loadData();
        }
    };

    const openEdit = (action: Action) => {
        setEditingAction(action);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingAction(undefined);
    };

    // Filter logic
    const filteredActions = actions.filter(action => {
        const matchesStatus = statusFilter === 'All' || action.status === statusFilter;
        const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'Low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Doing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Waiting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getTagDetails = (tagId: string) => tags.find(t => t.id === tagId);

    if (loading) {
        return <div className="p-8 text-center">Loading actions...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-foreground">Actions</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Action
                </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search actions..."
                        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Doing">Doing</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Done">Done</option>
                        <option value="Archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Added Sorting Logic */}
            <div className="flex flex-col gap-2">
                {filteredActions
                    .sort((a, b) => {
                        // 1. Sort by Priority (High > Medium > Low)
                        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                        // Default to 0 if priority is missing or unknown
                        const pA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
                        const pB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

                        if (pA !== pB) return pB - pA; // Descending priority

                        // 2. Sort by Start Date (Earliest first)
                        // If no start date, treat as far future or past? Usually tasks without dates are less urgent or backlog.
                        // Let's put them at the end.
                        const dateA = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
                        const dateB = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;

                        return dateA - dateB;
                    })
                    .map((action) => (
                        <div
                            key={action.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                        >
                            {/* Left: Status & Priority & Title */}
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", getPriorityColor(action.priority))}>
                                        {action.priority}
                                    </span>
                                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", getStatusColor(action.status))}>
                                        {action.status}
                                    </span>
                                    <h3 className="font-semibold text-base text-card-foreground truncate min-w-[100px]" title={action.title}>
                                        {action.title}
                                    </h3>
                                </div>

                                {/* Description placeholder if needed, or just keep title */}
                                {action.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1 truncate max-w-lg">
                                        {action.description}
                                    </p>
                                )}

                                {/* Dates & Tags inline */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    {action.start_date && (
                                        <div className="flex items-center gap-1" title="Start Date">
                                            <Calendar className="h-3 w-3" />
                                            <span>Start: {new Date(action.start_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {action.due_date && (
                                        <div className={cn("flex items-center gap-1", new Date(action.due_date) < new Date() && action.status !== 'Done' ? "text-destructive font-medium" : "")} title="Due Date">
                                            <Clock className="h-3 w-3" />
                                            <span>Due: {new Date(action.due_date).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    {(action.label_ids?.length || 0) > 0 && (
                                        <div className="flex flex-wrap gap-1 border-l border-border pl-2 ml-2">
                                            {action.label_ids?.map((labelId: string) => {
                                                const tag = getTagDetails(labelId);
                                                if (!tag) return null;
                                                return (
                                                    <span
                                                        key={labelId}
                                                        className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white"
                                                        style={{ backgroundColor: tag.color || '#999' }}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start sm:self-center">
                                <button
                                    onClick={() => openEdit(action)}
                                    className="text-xs font-medium text-primary hover:underline px-2 py-1"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(action.id)}
                                    className="text-xs font-medium text-destructive hover:underline px-2 py-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                {filteredActions.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <CheckSquare className="h-6 w-6 opacity-50" />
                        </div>
                        <p>No actions found matching your filters.</p>
                    </div>
                )}
            </div>

            <ActionForm
                isOpen={isFormOpen}
                initialData={editingAction}
                onSubmit={editingAction ? handleUpdate : handleCreate}
                onCancel={closeForm}
            />
        </div>
    );
}

