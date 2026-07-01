import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { 
    Users, Search, Plus, Mail, Phone, 
    Calendar, DollarSign, ArrowRight, Edit, Trash2, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Components
import CustomerModal from '../components/CustomerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Customers = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'Admin';
    
    // States
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Queries
    const { data: response, isLoading } = useQuery({
        queryKey: ['customers', page, debouncedSearch],
        queryFn: async () => (await api.get(`/customers?page=${page}&search=${debouncedSearch}`)).data,
        keepPreviousData: true
    });

    const customers = response?.data || [];
    const pagination = response?.pagination || {};

    const handleExportCSV = () => {
        if (customers.length === 0) return toast.error('No data to export');
        
        const headers = ['Name', 'Email', 'Phone', 'Company', 'Total Spent', 'Joined Date'];
        const csvRows = customers.map(c => [
            c.full_name,
            c.email,
            c.phone || 'N/A',
            c.company || 'Private',
            c.total_spent,
            new Date(c.created_at).toLocaleDateString()
        ].join(','));

        const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Customer list exported');
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('Customer created successfully');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to create customer')
    });

    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/customers/${selectedCustomer.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('Customer updated successfully');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to update customer')
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/customers/${selectedCustomer.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('Customer deleted successfully');
            setDeleteOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete customer')
    });

    const handleFormSubmit = (data) => {
        if (selectedCustomer) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer CRM</h1>
                    <p className="text-muted-foreground mt-1">Manage client relationships and track lifetime value.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl font-bold hover:bg-secondary/80 transition-all"
                    >
                        <Download size={20} />
                        Export CSV
                    </button>
                    {/* Add Customer Button - Admin Only */}
                    {isAdmin && (
                        <button 
                            onClick={() => { setSelectedCustomer(null); setModalOpen(true); }}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                        >
                            <Plus size={20} />
                            Add Customer
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Filters */}
            <SearchBar 
                value={searchTerm}
                onChange={(val) => { setSearchTerm(val); setPage(1); }}
                placeholder="Search by name, email or company..."
                className="flex-1"
            />

            {/* Customer Grid */}
            {isLoading ? (
                <LoadingState />
            ) : customers.length === 0 ? (
                <EmptyState icon={Users} title="No customers found" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map((customer) => (
                        <div key={customer.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                            {isAdmin && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => { setSelectedCustomer(customer); setModalOpen(true); }}
                                        className="p-2 bg-secondary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedCustomer(customer); setDeleteOpen(true); }}
                                        className="p-2 bg-secondary rounded-lg hover:bg-destructive hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                                    {customer.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{customer.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{customer.company || 'Private Client'}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail size={16} />
                                    <span>{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone size={16} />
                                    <span>{customer.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar size={16} />
                                    <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Spent</p>
                                    <p className="text-lg font-bold text-primary">{formatCurrency(customer.total_spent)}</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                    className="p-2 bg-secondary rounded-lg hover:bg-primary hover:text-white transition-all"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <Pagination 
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
            />

            {/* Modals */}
            <CustomerModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedCustomer}
                isLoading={createMutation.isLoading || updateMutation.isLoading}
            />

            <ConfirmDialog 
                isOpen={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isLoading}
                title="Delete Customer"
                message={`Are you sure you want to delete ${selectedCustomer?.full_name}? All purchase history snapshots will retain anonymized reference to this ID but personal data will be purged.`}
            />
        </div>
    );
};

export default Customers;
