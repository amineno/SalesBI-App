import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { 
    Plus, Search, Filter, MoreVertical, 
    AlertTriangle, CheckCircle2, Package, 
    Download, Edit, Trash2, ChevronLeft, ChevronRight,
    Upload, Loader2, FileSpreadsheet, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Components
import DataTable from '../components/DataTable';
import ProductModal from '../components/ProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const Inventory = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);
    
    // States
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef(null);

    // Queries
    const { data: response, isLoading } = useQuery({
        queryKey: ['products', page, debouncedSearch, user?.role],
        queryFn: async () => (await api.get(`/products?page=${page}&search=${debouncedSearch}`)).data,
        keepPreviousData: true
    });

    const products = response?.data || [];
    const pagination = response?.pagination || {};

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/products', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            toast.success('Product created successfully');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to create product')
    });

    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/products/${selectedProduct.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            toast.success('Product updated successfully');
            setModalOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to update product')
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/products/${selectedProduct.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            toast.success('Product deleted successfully');
            setDeleteOpen(false);
            setSelectedIds(prev => prev.filter(id => id !== selectedProduct.id));
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete product')
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => api.post('/products/bulk-delete', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            toast.success('Selected products deleted');
            setSelectedIds([]);
            setBulkDeleteOpen(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Bulk delete failed')
    });

    const toggleSelection = (id) => {
        if (!isAdmin) return;
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!isAdmin) return;
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const handleFormSubmit = (data) => {
        if (!isAdmin) {
            toast.error('Only admins can modify products');
            return;
        }

        if (selectedProduct) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const downloadCSV = (headers, rows, fileName) => {
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCSV = () => {
        if (products.length === 0) return toast.error('No data to export');

        // Prepare data for Excel
        const worksheetData = products.map(p => ({
            'Name': p.name,
            'SKU': p.sku,
            'Category': p.category,
            'Price': parseFloat(p.price) || 0,
            'Quantity': parseInt(p.quantity) || 0
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

        // Auto-size columns
        const columnWidths = [
            { wch: Math.max(...worksheetData.map(d => d.Name.length), 10) },
            { wch: Math.max(...worksheetData.map(d => d.SKU.length), 10) },
            { wch: Math.max(...worksheetData.map(d => d.Category.length), 10) },
            { wch: 10 }, // Price
            { wch: 10 }  // Quantity
        ];
        worksheet['!cols'] = columnWidths;

        // Export file
        XLSX.writeFile(workbook, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        toast.success('Inventory exported to Excel (.xlsx)', {
            icon: '📊'
        });
    };

    const handleImportCSV = async (e) => {
        if (!isAdmin) return;
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                const lines = content.split(/\r?\n/).filter(line => line.trim());
                if (lines.length < 2) throw new Error('File is empty or missing data');

                const dataLines = lines.slice(1);
                let successCount = 0;
                let errorCount = 0;
                const errors = [];

                for (let i = 0; i < dataLines.length; i++) {
                    const line = dataLines[i];
                    // Support both comma and semicolon
                    const delimiter = line.includes(';') ? ';' : ',';
                    const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                    
                    if (cols.length < 5) {
                        errorCount++;
                        errors.push(`Line ${i + 2}: Missing columns (Expected 5, found ${cols.length})`);
                        continue;
                    }

                    const [name, sku, category, price, quantity] = cols;

                    try {
                        await api.post('/products', {
                            name: name || 'Unnamed Product',
                            sku: sku || `SKU-${Date.now()}-${i}`,
                            category: category || 'Uncategorized',
                            price: parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
                            quantity: parseInt(quantity.replace(/[^0-9]/g, '')) || 0,
                            low_stock_threshold: 10,
                            cost: 0,
                            description: `Imported on ${new Date().toLocaleDateString()}`
                        });
                        successCount++;
                    } catch (err) {
                        errorCount++;
                        errors.push(`Line ${i + 2} (${sku || 'No SKU'}): ${err.response?.data?.error || 'Server error'}`);
                    }
                }

                if (successCount > 0) {
                    toast.success(`${successCount} products imported!`);
                    queryClient.invalidateQueries(['products']);
                }
                if (errorCount > 0) {
                    toast.error(`${errorCount} entries failed.`);
                }
            } catch (err) {
                toast.error(err.message || 'Failed to read CSV file');
            } finally {
                setIsImporting(false);
                e.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    const columns = [
        ...(isAdmin ? [{
            header: (
                <button onClick={handleSelectAll} className="p-1 hover:bg-secondary rounded-md">
                    {selectedIds.length === products.length && products.length > 0 ? <CheckSquare size={18} className="text-primary"/> : <Square size={18} />}
                </button>
            ),
            cell: (p) => (
                <button onClick={() => toggleSelection(p.id)} className="p-1 hover:bg-secondary rounded-md">
                    {selectedIds.includes(p.id) ? <CheckSquare size={18} className="text-primary"/> : <Square size={18} />}
                </button>
            )
        }] : []),
        { 
            header: 'Product', 
            cell: (p) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-primary">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                    </div>
                </div>
            )
        },
        { 
            header: 'Category', 
            cell: (p) => <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px] font-bold uppercase tracking-wider">{p.category}</span>
        },
        { 
            header: 'Price', 
            accessor: 'price',
            cell: (p) => <span className="font-bold text-sm text-primary">${parseFloat(p.price).toFixed(2)}</span>
        },
        { 
            header: 'Stock Level', 
            cell: (p) => (
                <div className="flex flex-col gap-1 w-32">
                    <div className="flex justify-between items-end">
                        <p className="text-xs font-bold">{p.quantity} <span className="text-[10px] text-muted-foreground font-medium">units</span></p>
                        <p className={`text-[10px] font-bold ${p.quantity <= (p.low_stock_threshold || 10) ? 'text-destructive' : 'text-green-500'}`}>
                            {p.quantity <= (p.low_stock_threshold || 10) ? 'Low' : 'Healthy'}
                        </p>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${p.quantity <= (p.low_stock_threshold || 10) ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min((p.quantity / 100) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (p) => p.quantity <= (p.low_stock_threshold || 10) ? 
                <StatusBadge type="destructive" text="Restock" icon={AlertTriangle} /> : 
                <StatusBadge type="success" text="Active" icon={CheckCircle2} />
        }
    ];

    const actions = isAdmin ? [
        {
            icon: <Edit size={18} />,
            label: 'Edit',
            onClick: (p) => {
                setSelectedProduct(p);
                setModalOpen(true);
            }
        },
        {
            icon: <Trash2 size={18} />,
            label: 'Delete',
            className: 'text-destructive hover:bg-destructive/10',
            onClick: (p) => {
                setSelectedProduct(p);
                setDeleteOpen(true);
            }
        }
    ] : [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">{isAdmin ? 'Inventory Engine' : 'Product Catalog'}</h1>
                    <p className="text-muted-foreground mt-1 font-medium">Real-time product availability and catalog management.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isAdmin && selectedIds.length > 0 && (
                        <button 
                            onClick={() => setBulkDeleteOpen(true)}
                            className="flex items-center gap-2 bg-destructive/10 text-destructive px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-destructive hover:text-white transition-all animate-in zoom-in-95 duration-200"
                        >
                            <Trash2 size={16} />
                            Delete Selected ({selectedIds.length})
                        </button>
                    )}

                    {isAdmin && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportCSV}
                                accept=".csv"
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="flex items-center gap-2 bg-secondary/50 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-secondary transition-all border border-border disabled:opacity-50"
                            >
                                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                Import
                            </button>
                        </>
                    )}
                    
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-secondary/50 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-secondary transition-all border border-border"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    
                    {isAdmin && (
                        <button 
                            onClick={() => { setSelectedProduct(null); setModalOpen(true); }}
                            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} />
                            New Product
                        </button>
                    )}
                </div>
            </div>

            {/* Metrics Mini-Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Package size={24}/></div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total SKU Count</p>
                        <p className="text-2xl font-black">{pagination.total || 0}</p>
                    </div>
                </div>
                {isAdmin && (
                    <>
                        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive"><AlertTriangle size={24}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Low Stock Items</p>
                                <p className="text-2xl font-black text-destructive">{pagination.lowStockCount || 0}</p>
                            </div>
                        </div>
                        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500"><CheckCircle2 size={24}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock Health</p>
                                <p className="text-2xl font-black text-green-500">
                                    {pagination.total > 0 
                                        ? ((pagination.activeCount / pagination.total) * 100).toFixed(1) 
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filters & Search */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                <SearchBar 
                    value={searchTerm}
                    onChange={(val) => { setSearchTerm(val); setPage(1); }}
                    placeholder="Search by product name, SKU or category..."
                    className="w-full"
                />
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <DataTable 
                    columns={columns} 
                    data={products} 
                    isLoading={isLoading} 
                    actions={actions}
                />
            </div>

            {/* Pagination & Stats */}
            <div className="bg-card border border-border px-6 py-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <p className="text-xs text-muted-foreground font-medium">
                    Orchestrating <span className="font-bold text-foreground">{pagination.total || 0}</span> enterprise assets across the global catalog.
                </p>
                <Pagination 
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                />
            </div>

            {/* Modals */}
            {isAdmin && (
                <ProductModal 
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={selectedProduct}
                    isLoading={createMutation.isLoading || updateMutation.isLoading}
                />
            )}

            {isAdmin && (
                <>
                    <ConfirmDialog 
                        isOpen={isDeleteOpen}
                        onClose={() => setDeleteOpen(false)}
                        onConfirm={() => deleteMutation.mutate()}
                        isLoading={deleteMutation.isLoading}
                        title="Remove Product"
                        message={`Are you sure you want to permanently delete "${selectedProduct?.name}"? All inventory history will be purged.`}
                    />
                    <ConfirmDialog 
                        isOpen={isBulkDeleteOpen}
                        onClose={() => setBulkDeleteOpen(false)}
                        onConfirm={() => bulkDeleteMutation.mutate(selectedIds)}
                        isLoading={bulkDeleteMutation.isLoading}
                        title="Bulk Deletion"
                        message={`Are you sure you want to delete ${selectedIds.length} selected products? This action is irreversible.`}
                    />
                </>
            )}
        </div>
    );
};

export default Inventory;
