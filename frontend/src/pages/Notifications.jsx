import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { 
    Bell, CheckCheck, Trash2, Clock, 
    AlertTriangle, ShoppingCart, Info, UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Components
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const Notifications = () => {
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications-full'],
        queryFn: async () => (await api.get('/notifications')).data
    });

    const markReadMutation = useMutation({
        mutationFn: (id) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications-full']);
            queryClient.invalidateQueries(['notifications']); // Dropdown query
        }
    });

    const clearMutation = useMutation({
        mutationFn: () => api.delete('/notifications/clear'),
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications-full']);
            queryClient.invalidateQueries(['notifications']);
            toast.success('Inbox cleared');
        }
    });

    const getIcon = (type) => {
        switch(type) {
            case 'low_stock': return <AlertTriangle className="text-destructive" size={20} />;
            case 'new_order': return <ShoppingCart className="text-primary" size={20} />;
            case 'new_customer': return <UserPlus className="text-green-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    if (isLoading) return <LoadingState />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-1">Keep track of system alerts and inventory changes.</p>
                </div>
                <button 
                    onClick={() => clearMutation.mutate()}
                    className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-sm font-bold hover:bg-secondary/80 transition-all border border-border"
                >
                    <Trash2 size={18} />
                    Clear All
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {notifications?.map((notif) => (
                    <div 
                        key={notif.id}
                        className={`bg-card border border-border rounded-2xl p-5 flex items-start gap-4 transition-all hover:border-primary/30 group ${!notif.is_read ? 'shadow-lg shadow-primary/5 border-l-4 border-l-primary' : ''}`}
                    >
                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                            {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className={`font-bold transition-colors ${!notif.is_read ? 'text-primary' : 'text-foreground'}`}>
                                    {notif.type.replace('_', ' ').toUpperCase()}
                                </p>
                                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(notif.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                            
                            {!notif.is_read && (
                                <button 
                                    onClick={() => markReadMutation.mutate(notif.id)}
                                    className="mt-3 text-xs font-bold text-primary flex items-center gap-1.5 hover:underline"
                                >
                                    <CheckCheck size={14} />
                                    Mark as read
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {(!notifications || notifications.length === 0) && (
                    <EmptyState icon={Bell} title="Empty Inbox" message="You're all caught up! No new notifications at this time." />
                )}
            </div>
        </div>
    );
};

export default Notifications;
