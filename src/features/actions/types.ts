export type ActionStatus = 'Open' | 'Doing' | 'Waiting' | 'Done' | 'Archived';
export type ActionPriority = 'Low' | 'Medium' | 'High';

export interface ActionFilter {
    status?: ActionStatus | 'All';
    priority?: ActionPriority | 'All';
    search?: string;
}
