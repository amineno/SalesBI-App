import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
    ShoppingBag, Search, Plus, Filter, 
    MoreVertical, Download, Trash2, Calendar, 
    ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Components
import DataTable from '../components/DataTable';
import OrderModal from '../components/OrderModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';

const Orders = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);
    
    // States
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Queries
    const { data: response, isLoading } = useQuery({
        queryKey: ['orders', page, searchTerm, statusFilter],
        queryFn: async () => (await api.get(`/orders?page=${page}&search=${searchTerm}&status=${statusFilter}`)).data,
        keepPreviousData: true
    });

    const orders = response?.data || [];
    const pagination = response?.pagination || {};

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/orders', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['customers']);
            queryClient.invalidateQueries(['products']);
            toast.success('Order placed. Waiting for approval.');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to process order')
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['kpis']);
            toast.success(`Order #${variables.id} is now ${variables.status}`);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to update status')
    });


    const handleFormSubmit = (data) => {
        // Enforce pending status for new orders
        createMutation.mutate({ ...data, status: 'pending' });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const columns = [
        { 
            header: 'Order ID', 
            cell: (o) => <span className="font-bold">#{o.id}</span>
        },
        { 
            header: 'Customer', 
            cell: (o) => (
                <div>
                    <p className="font-semibold text-sm">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                </div>
            )
        },
        { 
            header: 'Date', 
            cell: (o) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Calendar size={14} />
                    {new Date(o.order_date).toLocaleDateString()}
                </div>
            )
        },
        { 
            header: 'Total Amount', 
            cell: (o) => <span className="font-extrabold text-primary">{formatCurrency(o.total_amount)}</span>
        },
        {
            header: 'Status',
            cell: (o) => {
                const types = { 
                    completed: 'success', 
                    accepted: 'success',
                    pending: 'warning', 
                    cancelled: 'destructive' 
                };
                const labels = {
                    pending: 'Pending',
                    accepted: 'Accepted',
                    completed: 'Completed',
                    cancelled: 'Cancelled'
                };
                return <StatusBadge type={types[o.status]} text={labels[o.status] || o.status} />;
            }
        }
    ];

    const actions = [
        ...(isAdmin ? [
            {
                icon: <CheckCircle size={18} className="text-green-500" />,
                label: 'Accept Order',
                show: (o) => o.status === 'pending',
                onClick: (o) => statusMutation.mutate({ id: o.id, status: 'accepted' })
            },
            {
                icon: <XCircle size={18} className="text-red-500" />,
                label: 'Cancel Order',
                show: (o) => o.status === 'pending',
                onClick: (o) => statusMutation.mutate({ id: o.id, status: 'cancelled' })
            }
        ] : []),
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Approve new orders and manage customer transactions.</p>
                </div>
                <button 
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Create Order
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <SearchBar 
                    value={searchTerm}
                    onChange={(val) => { setSearchTerm(val); setPage(1); }}
                    placeholder="Search by Order ID or Customer name..."
                    className="flex-1"
                />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none shadow-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <DataTable 
                    columns={columns} 
                    data={orders} 
                    isLoading={isLoading} 
                    actions={actions}
                />
            </div>

            <div className="bg-card border border-border px-6 py-4 rounded-2xl flex justify-between items-center shadow-sm">
                <p className="text-xs text-muted-foreground font-medium">
                    Management of <span className="font-bold text-foreground">{pagination.total || 0}</span> enterprise orders
                </p>
                <Pagination 
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                />
            </div>

            <OrderModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleFormSubmit}
                isLoading={createMutation.isLoading}
            />

        </div>
    );
};

export default Orders;
