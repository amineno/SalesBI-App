import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { 
    UserPlus, Shield, Mail, Calendar, 
    Edit, Trash2, UserCog, MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Components
import DataTable from '../components/DataTable';
import UserModal from '../components/UserModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';

const Users = () => {
    const queryClient = useQueryClient();
    
    // States
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Queries
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('User account created');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to create user')
    });

    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/users/${selectedUser.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('User updated');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to update user')
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/users/${selectedUser.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('User account removed');
            setDeleteOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete user')
    });

    const handleFormSubmit = (data) => {
        if (selectedUser) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const columns = [
        { 
            header: 'User', 
            cell: (u) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {u.full_name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                </div>
            )
        },
        { 
            header: 'Role', 
            cell: (u) => <StatusBadge type={u.role === 'Admin' ? 'info' : 'secondary'} text={u.role} icon={Shield} />
        },
        { 
            header: 'Joined Date', 
            cell: (u) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    {new Date(u.created_at).toLocaleDateString()}
                </div>
            )
        }
    ];

    const actions = [
        {
            icon: <Edit size={18} />,
            label: 'Edit',
            onClick: (u) => {
                setSelectedUser(u);
                setModalOpen(true);
            }
        },
        {
            icon: <Trash2 size={18} />,
            label: 'Delete',
            className: 'text-destructive hover:bg-destructive/10',
            onClick: (u) => {
                setSelectedUser(u);
                setDeleteOpen(true);
            }
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">Control access levels and manage team members.</p>
                </div>
                <button 
                    onClick={() => { setSelectedUser(null); setModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                    <UserPlus size={20} />
                    Invite User
                </button>
            </div>

            <DataTable 
                columns={columns} 
                data={users} 
                isLoading={isLoading} 
                actions={actions}
            />

            <UserModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedUser}
                isLoading={createMutation.isLoading || updateMutation.isLoading}
            />

            <ConfirmDialog 
                isOpen={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isLoading}
                title="Remove Access"
                message={`Are you sure you want to delete the account for ${selectedUser?.full_name}? This action is permanent and will revoke all access immediately.`}
            />
        </div>
    );
};

export default Users;
