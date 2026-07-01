import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from './Modal';
import { Plus, Trash2, Search, Loader2, Package, ShoppingBag, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const OrderModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [customerId, setCustomerId] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchProd, setSearchProd] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const { user } = useAuth();
    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);
    const queryClient = useQueryClient();

    // Fetch Customers & Products for selection
    const { data: customers } = useQuery({
        queryKey: ['customers-list'],
        queryFn: async () => (await api.get('/customers?limit=100')).data.data
    });

    const { data: products } = useQuery({
        queryKey: ['products-search', searchProd],
        queryFn: async () => (await api.get(`/products?limit=5&search=${searchProd}`)).data.data,
        enabled: searchProd.length > 1
    });

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setCustomerId('');
            setSelectedItems([]);
            setSearchProd('');
        } else if (customers && user && !isAdmin) {
            // Automatically find and set customer matching current user email for regular users
            const meAsCustomer = customers.find(c => c.email === user.email);
            if (meAsCustomer) {
                setCustomerId(meAsCustomer.id);
            }
        }
    }, [isOpen, customers, user]);
    
    const handleSyncIdentity = async () => {
        setIsSyncing(true);
        try {
            // Check if customer already exists locally
            const existing = customers?.find(c => c.email === user.email);
            
            if (existing) {
                // Update existing record
                await api.put(`/customers/${existing.id}`, {
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    company: existing.company || 'SalesBI Enterprise',
                });
                toast.success('Enterprise identity updated successfully');
            } else {
                // Create new record
                await api.post('/customers', {
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    company: 'SalesBI Enterprise',
                });
                toast.success('Identity synced with enterprise database');
            }
            queryClient.invalidateQueries(['customers-list']);
        } catch (err) {
            toast.error('Failed to sync identity');
        } finally {
            setIsSyncing(false);
        }
    };

    const addItem = (product) => {
        const exists = selectedItems.find(item => item.product_id === product.id);
        if (exists) {
            toast.error('Product already in order');
            return;
        }
        setSelectedItems([...selectedItems, {
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            unit_price: parseFloat(product.price)
        }]);
        setSearchProd('');
    };

    const removeItem = (id) => {
        setSelectedItems(selectedItems.filter(item => item.product_id !== id));
    };

    const updateQty = (id, val) => {
        setSelectedItems(selectedItems.map(item => 
            item.product_id === id ? { ...item, quantity: parseInt(val) || 0 } : item
        ));
    };

    const total = selectedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!customerId) {
            return toast.error('Identity required: Please click "Sync Identity Now" to link your account before submitting.', {
                duration: 5000,
                icon: '⚠️'
            });
        }
        if (selectedItems.length === 0) return toast.error('Please add at least one item');
        
        onSubmit({
            customer_id: customerId,
            items: selectedItems
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Construct New Order Request" size="lg">
            <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Enterprise Client</label>
                        {isAdmin ? (
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full bg-secondary/30 border border-border rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="text-muted-foreground">Select Enterprise Client...</option>
                                {customers?.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.full_name} ({c.company || 'Private Client'})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <>
                                <div className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3.5 flex items-center justify-between group transition-all hover:bg-primary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">{user?.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{user?.email}</p>
                                            {user?.phone && <p className="text-[9px] text-primary/70 font-bold uppercase tracking-widest">{user.phone}</p>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Founder User</span>
                                        {customerId && <span className="text-[9px] text-primary font-bold mt-1 uppercase tracking-widest">ID: #{customerId}</span>}
                                    </div>
                                </div>
                                {!customerId && customers && (
                                    <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-2xl animate-in zoom-in-95 duration-300">
                                        <p className="text-[10px] text-destructive font-black uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                                            Identity Mismatch Detected
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1 font-medium italic">
                                            No customer record linked to your email found in the enterprise database.
                                        </p>
                                        <button 
                                            type="button"
                                            onClick={handleSyncIdentity}
                                            disabled={isSyncing}
                                            className="mt-3 w-full py-2 bg-destructive text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={3} />}
                                            Sync Identity Now
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Catalog Lookup</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input 
                                type="text"
                                value={searchProd}
                                onChange={(e) => setSearchProd(e.target.value)}
                                placeholder="Search products by SKU or name..."
                                className="w-full bg-secondary/30 border border-border rounded-2xl pl-12 pr-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all"
                            />
                        </div>
                        {products && products.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-20 py-2 divide-y divide-border">
                                {products.map(p => (
                                    <button 
                                        key={p.id}
                                        type="button"
                                        onClick={() => addItem(p)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-secondary transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black">{p.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-primary">${parseFloat(p.price).toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-secondary/10 border border-border rounded-3xl overflow-hidden shadow-inner">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/40 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-6 py-4 w-28">Quantity</th>
                                <th className="px-6 py-4 text-right">Unit Price</th>
                                <th className="px-6 py-4 text-right">Subtotal</th>
                                <th className="px-6 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {selectedItems.map(item => (
                                <tr key={item.product_id} className="group hover:bg-secondary/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-black">{item.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQty(item.product_id, e.target.value)}
                                            className="w-full bg-card border border-border rounded-xl text-sm px-4 py-2 font-black focus:ring-2 focus:ring-primary/50 outline-none"
                                            min="1"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">${item.unit_price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-primary">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            type="button"
                                            onClick={() => removeItem(item.product_id)} 
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {selectedItems.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="opacity-30 grayscale flex flex-col items-center gap-2">
                                            <Package size={40} />
                                            <p className="text-xs font-black uppercase tracking-widest">Awaiting Line Items</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-secondary/40 border-t border-border">
                            <tr>
                                <td colSpan="3" className="px-6 py-6 text-right text-sm font-black uppercase tracking-widest text-muted-foreground">Order Total</td>
                                <td className="px-6 py-6 text-right text-2xl font-black text-primary">${total.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-secondary/50 hover:bg-secondary transition-all border border-border"
                    >
                        Cancel Order
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading || selectedItems.length === 0}
                        className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-2xl shadow-primary/30 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
                        Submit Order for Approval
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default OrderModal;
