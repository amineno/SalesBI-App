import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';

const CustomerModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                full_name: '',
                email: '',
                phone: '',
                company: ''
            });
        }
    }, [initialData, reset]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialData ? 'Edit Customer' : 'Add New Customer'}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Full Name *</label>
                        <input 
                            {...register('full_name', { required: 'Name is required' })}
                            className={`w-full bg-secondary/50 border ${errors.full_name ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                        {errors.full_name && <p className="text-xs text-destructive font-medium">{errors.full_name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Email Address *</label>
                        <input 
                            {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                            className={`w-full bg-secondary/50 border ${errors.email ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                        {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Phone Number</label>
                            <input 
                                {...register('phone')}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Company</label>
                            <input 
                                {...register('company')}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
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
                        {initialData ? 'Update Customer' : 'Create Customer'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CustomerModal;
