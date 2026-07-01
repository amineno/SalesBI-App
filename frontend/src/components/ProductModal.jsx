import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProductModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { user } = useAuth();
    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                price: parseFloat(initialData.price),
                cost: parseFloat(initialData.cost) || 0,
                quantity: parseInt(initialData.quantity),
                low_stock_threshold: parseInt(initialData.low_stock_threshold) || 10
            });
        } else {
            reset({
                name: '',
                category: '',
                price: 0,
                cost: 0,
                sku: '',
                description: '',
                quantity: 0,
                low_stock_threshold: 10
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialData ? 'Edit Product' : 'Add New Product'}
            size="md"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Product Name *</label>
                        <input 
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g. Premium Wireless Mouse"
                            className={`w-full bg-secondary/50 border ${errors.name ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                        {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">SKU / Serial *</label>
                        <input 
                            {...register('sku', { required: 'SKU is required' })}
                            placeholder="e.g. MOUSE-001"
                            className={`w-full bg-secondary/50 border ${errors.sku ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                        {errors.sku && <p className="text-xs text-destructive font-medium">{errors.sku.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Category *</label>
                        <select 
                            {...register('category', { required: 'Category is required' })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Select Category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Software">Software</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Sell Price ($) *</label>
                        <input 
                            type="number"
                            step="0.01"
                            {...register('price', { required: 'Price is required', min: 0 })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {isAdmin && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Unit Cost ($)</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    {...register('cost', { min: 0 })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Low Stock Alert Threshold</label>
                                <input 
                                    type="number"
                                    {...register('low_stock_threshold', { min: 0 })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Initial Stock</label>
                        <input 
                            type="number"
                            disabled={!isAdmin && initialData}
                            {...register('quantity', { min: 0 })}
                            className={`w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 ${!isAdmin && initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Description</label>
                    <textarea 
                        {...register('description')}
                        rows={3}
                        placeholder="Provide details about the product..."
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-secondary hover:bg-secondary/80 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={20} />}
                        {initialData ? 'Update Product' : 'Create Product'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductModal;
