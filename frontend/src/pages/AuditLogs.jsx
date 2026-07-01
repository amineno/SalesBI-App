import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
    Shield, Search, Filter, Clock, 
    User, HardDrive, Terminal
} from 'lucide-react';

// Components
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import DateRangePicker from '../components/DateRangePicker';

const AuditLogs = () => {
    const [page, setPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateRange, setDateRange] = useState('all');

    const { data: response, isLoading } = useQuery({
        queryKey: ['audit-logs', page, userSearch, actionFilter, dateRange],
        queryFn: async () => (await api.get(`/audit?page=${page}&user=${userSearch}&action=${actionFilter}&range=${dateRange}`)).data,
        keepPreviousData: true
    });

    const logs = response?.data || [];
    const pagination = response?.pagination || {};

    const columns = [
        { 
            header: 'Timestamp', 
            cell: (l) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{new Date(l.created_at).toLocaleDateString()}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
                </div>
            )
        },
        { 
            header: 'User', 
            cell: (l) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <User size={14} />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{l.user_name || 'System'}</p>
                        <p className="text-[10px] text-muted-foreground">{l.ip_address || 'Internal'}</p>
                    </div>
                </div>
            )
        },
        { 
            header: 'Action', 
            cell: (l) => {
                const isDestructive = l.action.includes('DELETE');
                const isUpdate = l.action.includes('UPDATE');
                return (
                    <StatusBadge 
                        type={isDestructive ? 'destructive' : isUpdate ? 'warning' : 'info'} 
                        text={l.action.replace('_', ' ')} 
                        icon={Terminal}
                    />
                );
            }
        },
        { 
            header: 'Entity', 
            cell: (l) => (
                <div className="flex items-center gap-2 text-sm">
                    <HardDrive size={14} className="text-muted-foreground" />
                    <span className="capitalize">{l.table_affected}</span>
                </div>
            )
        },
        {
            header: 'Details',
            cell: (l) => {
                const snapshot = typeof l.data_snapshot === 'object'
                    ? JSON.stringify(l.data_snapshot)
                    : l.data_snapshot || '-';
                return (
                    <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                        {snapshot}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Trails</h1>
                    <p className="text-muted-foreground mt-1">Monitor all system activities and administrative changes.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <SearchBar 
                    value={userSearch}
                    onChange={(val) => { setUserSearch(val); setPage(1); }}
                    placeholder="Filter by user name or email..."
                    className="flex-1"
                />
                <div className="flex gap-2 w-full md:w-auto">
                    <DateRangePicker 
                        value={dateRange}
                        onChange={(val) => { setDateRange(val); setPage(1); }}
                    />
                    <select 
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        className="bg-card border border-border rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/50 outline-none min-w-[160px] appearance-none cursor-pointer"
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE_PRODUCT">Create Product</option>
                        <option value="UPDATE_PRODUCT">Update Product</option>
                        <option value="DELETE_PRODUCT">Delete Product</option>
                        <option value="CREATE_ORDER">Create Order</option>
                        <option value="UPDATE_CUSTOMER">Update Customer</option>
                    </select>
                </div>
            </div>

            <DataTable 
                columns={columns} 
                data={logs} 
                isLoading={isLoading} 
            />

            <Pagination 
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
            />
        </div>
    );
};

export default AuditLogs;
