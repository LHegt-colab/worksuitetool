import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { actionsApi } from '../lib/api/actions';
import type { Action } from '../types';

export default function Actions() {
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDone, setShowDone] = useState(false);

    useEffect(() => {
        loadActions();
    }, []);

    async function loadActions() {
        try {
            setLoading(true);
            const data = await actionsApi.fetchActions();
            setActions(data);
        } catch (err) {
            setError('Failed to load actions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function toggleStatus(action: Action) {
        try {
            const newStatus = action.status === 'Done' ? 'Open' : 'Done';
            await actionsApi.updateAction(action.id, { status: newStatus });
            setActions(actions.map(a => a.id === action.id ? { ...a, status: newStatus } : a));
        } catch (err) {
            console.error('Failed to update status', err);
        }
    }

    const filteredActions = actions.filter(a => showDone ? a.status === 'Done' : a.status !== 'Done');

    if (loading) return <div className="p-4">Loading actions...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-500 bg-red-50';
            case 'Medium': return 'text-orange-500 bg-orange-50';
            case 'Low': return 'text-green-500 bg-green-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primary">Actions</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowDone(!showDone)}
                        className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                    >
                        {showDone ? 'Show Open' : 'Show Done'}
                    </button>
                    <Link
                        to="/actions/new"
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Action
                    </Link>
                </div>
            </div>

            <div className="space-y-4">
                {filteredActions.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        No {showDone ? 'completed' : 'open'} actions found.
                    </div>
                ) : (
                    filteredActions.map((action) => (
                        <div
                            key={action.id}
                            className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary transition-colors"
                        >
                            <button
                                onClick={() => toggleStatus(action)}
                                className={`flex-shrink-0 ${action.status === 'Done' ? 'text-green-500' : 'text-text-muted hover:text-primary'} transition-colors`}
                            >
                                {action.status === 'Done' ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </button>

                            <Link to={`/actions/${action.id}`} className="flex-1 min-w-0 group">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`text-lg font-semibold truncate ${action.status === 'Done' ? 'line-through text-text-muted' : 'group-hover:text-primary'}`}>
                                        {action.title}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(action.priority)}`}>
                                        {action.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-text-muted">
                                    {action.due_date && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4" />
                                            <span>{new Date(action.due_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {action.grid_area && (
                                        <div className="flex items-center gap-1.5">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>{action.grid_area}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
