import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    BarChart3, FileText, Download,
    PieChart, TrendingUp, Table as TableIcon,
    Calendar, ArrowUpRight
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';
import { toast } from 'react-hot-toast';

// Components
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBoundary from '../components/ErrorBoundary';

const Reports = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [dateRange, setDateRange] = useState('30d');

    const { data: categories, isLoading: catLoading } = useQuery({
        queryKey: ['reportCategories', dateRange],
        queryFn: async () => {
            const data = (await api.get(`/reports/category?range=${dateRange}`)).data;
            return data.map(item => ({
                ...item,
                total_quantity: parseFloat(item.total_quantity || 0),
                total_revenue: parseFloat(item.total_revenue || 0)
            }));
        }
    });

    const { data: revenueData, isLoading: revLoading } = useQuery({
        queryKey: ['reportRevenue', dateRange],
        queryFn: async () => (await api.get(`/reports/revenue?range=${dateRange}`)).data
    });

    const { data: valuation } = useQuery({
        queryKey: ['reportValuation'],
        queryFn: async () => (await api.get('/reports/inventory-valuation')).data,
        enabled: isAdmin
    });

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const handleExport = (format) => {
        if (!categories || categories.length === 0) return toast.error('No data available to export');

        const headers = ['Category', 'Items Sold', 'Total Revenue'];
        const rows = categories.map(c => [c.category, parseFloat(c.total_quantity), parseFloat(c.total_revenue)]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: format === 'CSV' || format === 'Excel' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.${format === 'Excel' ? 'csv' : 'csv'}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Report exported as ${format}`);
    };

    if (catLoading) return <LoadingState />;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Advanced analytics and financial breakdown for your enterprise.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangePicker 
                        value={dateRange}
                        onChange={setDateRange}
                    />
                    {isAdmin && (
                        <>
                            <button 
                                onClick={() => handleExport('CSV')}
                                className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-xs font-bold hover:bg-secondary/80 transition-all border border-border"
                            >
                                <FileText size={18} />
                                Export CSV
                            </button>
                            <button 
                                onClick={() => handleExport('Excel')}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                <Download size={18} />
                                Export Excel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                    <StatCard 
                        title="Inventory Valuation" 
                        value={formatCurrency(valuation?.total_value || 0)} 
                        icon={<BarChart3 className="text-blue-500" />} 
                    />
                    <StatCard 
                        title="Cost of Goods" 
                        value={formatCurrency(valuation?.total_cost || 0)} 
                        icon={<TrendingUp className="text-orange-500" />} 
                    />
                    <StatCard 
                        title="Potential Profit" 
                        value={formatCurrency(valuation?.potential_profit || 0)} 
                        icon={<PieChart className="text-green-500" />} 
                    />
                </div>
            )}

            {/* Revenue Trend Chart */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp size={120} />
                </div>
                <h3 className="font-bold flex items-center gap-2 text-xl mb-10 relative z-10">
                    <Calendar size={24} className="text-primary" />
                    Revenue & Demand Performance
                </h3>
                <div className="h-[350px] relative z-10">
                    <ErrorBoundary>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevRep" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={10} 
                                    fontWeight={800} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => val >= 1000000 ? `$${(val/1000000).toFixed(1)}M` : `$${val/1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="hsl(var(--primary))" 
                                    fillOpacity={1} 
                                    fill="url(#colorRevRep)" 
                                    strokeWidth={4} 
                                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'white' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ErrorBoundary>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Performance */}
                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <h3 className="font-bold flex items-center gap-2 text-lg mb-8">
                        <BarChart3 size={20} className="text-primary" />
                        Revenue by Category
                    </h3>
                    <div className="h-[300px]">
                        <ErrorBoundary>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categories}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600} tickLine={false} axisLine={false}/>
                                    <YAxis 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={10} 
                                        fontWeight={800} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(val) => val >= 1000000 ? `$${(val/1000000).toFixed(1)}M` : `$${val/1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Bar 
                                        dataKey="total_revenue" 
                                        fill="hsl(var(--primary))" 
                                        radius={[10, 10, 0, 0]} 
                                        barSize={60}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Market Share Division */}
                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <h3 className="font-bold flex items-center gap-2 text-lg mb-8">
                        <PieChart size={20} className="text-primary" />
                        Sales Volume Distribution
                    </h3>
                    <div className="h-[300px]">
                        <ErrorBoundary>
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={categories}
                                        dataKey="total_quantity"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                    >
                                        {categories?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TableIcon size={20} className="text-primary"/>
                        <h3 className="font-bold">Category-wise Summary</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-8 py-4">Category</th>
                                <th className="px-8 py-4">Items Sold</th>
                                <th className="px-8 py-4 text-right">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categories?.map((c, i) => (
                                <tr key={i} className="hover:bg-secondary/20 transition-all group">
                                    <td className="px-8 py-5 font-bold">{c.category}</td>
                                    <td className="px-8 py-5 text-muted-foreground font-medium">{c.total_quantity} units</td>
                                    <td className="px-8 py-5 text-right font-extrabold text-primary">{formatCurrency(c.total_revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
