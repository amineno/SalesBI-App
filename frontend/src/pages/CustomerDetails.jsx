import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
    ChevronLeft, Mail, Phone, Building2, 
    Calendar, TrendingUp, ShoppingBag, Clock
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: customer, isLoading, error } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => (await api.get(`/customers/${id}`)).data
    });

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error="Customer not found" onRetry={() => navigate('/customers')} />;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <button 
                onClick={() => navigate('/customers')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
                <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronLeft size={20} />
                </div>
                <span className="font-semibold">Back to Customers</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm text-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-4xl mx-auto mb-6">
                            {customer.full_name.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-bold">{customer.full_name}</h2>
                        <p className="text-muted-foreground font-medium">{customer.company || 'Private Client'}</p>
                        
                        <div className="mt-8 space-y-4 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                                    <Mail size={16} />
                                </div>
                                <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                                    <Phone size={16} />
                                </div>
                                <span>{customer.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                                    <Clock size={16} />
                                </div>
                                <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary text-white rounded-3xl p-8 shadow-xl shadow-primary/20">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp size={24} />
                            <h3 className="font-bold">Lifetime Value</h3>
                        </div>
                        <p className="text-4xl font-extrabold mb-2">{formatCurrency(customer.total_spent)}</p>
                        <p className="text-primary-foreground/80 text-sm font-medium">Total revenue generated from this account.</p>
                    </div>
                </div>

                {/* History & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
                                <p className="text-2xl font-bold">{customer.orders?.length || 0}</p>
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Last Purchase</p>
                                <p className="text-2xl font-bold">{customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-bold text-lg">Purchase Order History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/30 text-muted-foreground text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Items</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {customer.orders?.map(order => (
                                        <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="px-6 py-4 font-bold">#{order.id}</td>
                                            <td className="px-6 py-4 text-sm">{new Date(order.order_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm">{order.itemCount} items</td>
                                            <td className="px-6 py-4 font-bold">{formatCurrency(order.total_amount)}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge 
                                                    type={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'warning'} 
                                                    text={order.status} 
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {(!customer.orders || customer.orders.length === 0) && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">No purchase history found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;
