import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const UserModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const { data: roles } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => (await api.get('/users/roles')).data
    });

    useEffect(() => {
        if (initialData) {
            // Find role_id based on role name if needed, assuming roles list is available
            const role = roles?.find(r => r.name === initialData.role);
            reset({
                ...initialData,
                role_id: role?.id || ''
            });
        } else {
            reset({
                full_name: '',
                email: '',
                password: '',
                role_id: ''
            });
        }
    }, [initialData, reset, roles]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialData ? 'Edit User' : 'Add New User'}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Full Name *</label>
                        <input 
                            {...register('full_name', { required: 'Name is required' })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Email Address *</label>
                        <input 
                            {...register('email', { required: 'Email is required' })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {!initialData && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Initial Password *</label>
                            <input 
                                type="password"
                                {...register('password', { required: 'Password is required' })}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Assign Role *</label>
                        <select 
                            {...register('role_id', { required: 'Role is required' })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Select Role</option>
                            {roles?.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold bg-secondary hover:bg-secondary/80 transition-all">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={20} />}
                        {initialData ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UserModal;
