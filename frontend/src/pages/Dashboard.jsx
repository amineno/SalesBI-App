import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    DollarSign, ShoppingBag, Users, TrendingUp,
    ArrowUpRight, ArrowDownRight, Package, AlertTriangle
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// Components
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trendRange, setTrendRange] = React.useState('monthly');
    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);

    const { data: kpis, isLoading: kpiLoading } = useQuery({
        queryKey: ['kpis', user?.id],
        queryFn: async () => (await api.get('/dashboard/kpis')).data
    });

    const { data: salesTrend } = useQuery({
        queryKey: ['salesTrend', user?.id, trendRange],
        queryFn: async () => (await api.get(`/dashboard/sales-trend?range=${trendRange}`)).data
    });

    const { data: topProducts } = useQuery({
        queryKey: ['topProducts', user?.id],
        queryFn: async () => (await api.get('/dashboard/top-products')).data
    });
    
    const { data: categoryDist } = useQuery({
        queryKey: ['categoryDist', user?.id],
        queryFn: async () => (await api.get('/dashboard/category-dist')).data
    });

    const { data: orderStatusDist } = useQuery({
        queryKey: ['orderStatusDist', user?.id],
        queryFn: async () => (await api.get('/dashboard/order-status')).data,
        enabled: isAdmin
    });

    const { data: invHealth } = useQuery({
        queryKey: ['invHealth'],
        queryFn: async () => (await api.get('/dashboard/inventory-health')).data,
        enabled: isAdmin
    });

    if (kpiLoading) return <LoadingState message="Analyzing performance metrics..." />;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const getTrendColor = (trend) => {
        const val = parseFloat(trend);
        return val >= 0;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            System Active • v{new Date().getFullYear()}.07
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic py-2 pr-8">
                        {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 18 ? 'Good Afternoon,' : 'Good Evening,'} {user?.full_name?.split(' ')[0]}
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium max-w-md">
                        {isAdmin 
                            ? 'Welcome to the command center. Here is your global enterprise performance breakdown.' 
                            : 'Your personal sales engine is running at peak capacity. Track your growth below.'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Session</p>
                        <p className="text-sm font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="h-12 w-[1px] bg-border mx-2 hidden lg:block" />
                    <button 
                        onClick={() => navigate('/orders')}
                        className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <ShoppingBag size={16} />
                        New Order
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                <StatCard 
                    title={isAdmin ? "Total Revenue" : "My Revenue"} 
                    value={formatCurrency(kpis?.totalRevenue)} 
                    trend={`${kpis?.revenueTrend >= 0 ? '+' : ''}${kpis?.revenueTrend}%`} 
                    trendUp={getTrendColor(kpis?.revenueTrend)}
                    icon={<DollarSign className="text-primary" />} 
                    onClick={() => navigate(isAdmin ? '/reports' : '/orders')}
                    className="cursor-pointer hover:scale-[1.02] transition-transform"
                />
                <StatCard 
                    title={isAdmin ? "Total Orders" : "My Orders"} 
                    value={kpis?.totalOrders} 
                    trend={`${kpis?.ordersTrend >= 0 ? '+' : ''}${kpis?.ordersTrend}%`} 
                    trendUp={getTrendColor(kpis?.ordersTrend)}
                    icon={<ShoppingBag className="text-purple-500" />} 
                    onClick={() => navigate('/orders')}
                    className="cursor-pointer hover:scale-[1.02] transition-transform"
                />
                
                {isAdmin ? (
                    <>
                        <StatCard 
                            title="Low Stock Items" 
                            value={kpis?.lowStockCount || 0} 
                            trend="Requires Restock" 
                            trendUp={false}
                            icon={<AlertTriangle className="text-destructive" />} 
                            onClick={() => navigate('/inventory')}
                            className="cursor-pointer hover:scale-[1.02] transition-transform"
                        />
                        <StatCard 
                            title="Profit Margin" 
                            value={`${parseFloat(kpis?.profitMargin || 0).toFixed(1)}%`} 
                            trend="Real-time" 
                            trendUp={true}
                            icon={<TrendingUp className="text-green-500" />} 
                        />
                    </>
                ) : (
                    <>
                        <StatCard 
                            title={isAdmin ? "Last System Action" : "Recent Activity"} 
                            value={kpis?.recentActivity 
                                ? (isAdmin 
                                    ? kpis.recentActivity.action.replace(/_/g, ' ') 
                                    : `Order ${kpis.recentActivity.status}`)
                                : 'No Activity'} 
                            trend={kpis?.recentActivity 
                                ? new Date(kpis.recentActivity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : 'Ready for work'} 
                            trendUp={true}
                            icon={<Package className="text-blue-500" />} 
                            onClick={() => navigate(isAdmin ? '/audit-logs' : '/orders')}
                            className="cursor-pointer hover:scale-[1.02] transition-transform"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter italic">{isAdmin ? 'Enterprise Revenue' : 'My Sales Trend'}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Timeline Analytics</p>
                        </div>
                        <div className="bg-secondary/20 backdrop-blur-md rounded-2xl p-1.5 flex gap-1 border border-border/50">
                            <button 
                                onClick={() => setTrendRange('monthly')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${trendRange === 'monthly' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
                            >
                                Monthly
                            </button>
                            <button 
                                onClick={() => setTrendRange('daily')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${trendRange === 'daily' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
                            >
                                Daily
                            </button>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ErrorBoundary>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrend}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                    <XAxis 
                                        dataKey="period" 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={10} 
                                        fontWeight={800} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(val) => {
                                            if (!val) return '';
                                            const parts = val.split('-');
                                            if (parts.length === 3) return parts[2]; // Day
                                            if (parts.length === 2) return parts[1]; // Month
                                            return val;
                                        }}
                                    />
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
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.period}</p>
                                                        <p className="text-sm font-black text-primary">{formatCurrency(payload[0].value)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="hsl(var(--primary))" 
                                        fillOpacity={1} 
                                        fill="url(#colorRev)" 
                                        strokeWidth={6} 
                                        animationDuration={2000}
                                        strokeLinecap="round"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Categorical Distribution - The Circle Chart */}
                <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-2xl flex flex-col group relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0 -translate-x-1/2 translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
                    <h3 className="font-black text-2xl mb-12 uppercase tracking-tighter italic relative z-10">Market Distribution</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ErrorBoundary>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {categoryDist?.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={[
                                                    'hsl(var(--primary))',
                                                    '#8b5cf6',
                                                    '#f59e0b',
                                                    '#10b981',
                                                    '#ef4444'
                                                ][index % 5]} 
                                                className="hover:opacity-80 transition-opacity outline-none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                                                        <p className="text-sm font-black text-primary">{formatCurrency(payload[0].value)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        content={({ payload }) => (
                                            <div className="flex flex-wrap justify-center gap-4 mt-8">
                                                {payload.map((entry, index) => (
                                                    <div key={`legend-${index}`} className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Order Fulfillment Distribution */}
                    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-2xl flex flex-col group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/10 transition-colors" />
                        <h3 className="font-black text-2xl mb-12 uppercase tracking-tighter italic relative z-10">Order Fulfillment</h3>
                        <div className="flex-1 min-h-[300px] relative z-10">
                            <ErrorBoundary>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={orderStatusDist}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={10}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {orderStatusDist?.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={[
                                                        '#10b981', // completed
                                                        '#f59e0b', // pending
                                                        '#ef4444', // cancelled
                                                        '#6366f1'  // processing
                                                    ][index % 4]} 
                                                    stroke="none"
                                                    className="outline-none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                                                            <p className="text-sm font-black text-primary">{payload[0].value} Enterprise Orders</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-4 mt-8">
                                                    {payload.map((entry, index) => (
                                                        <div key={`legend-${index}`} className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* Inventory Health Distribution */}
                    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-2xl flex flex-col group relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -z-0 -translate-x-1/2 translate-y-1/2 group-hover:bg-orange-500/10 transition-colors" />
                        <h3 className="font-black text-2xl mb-12 uppercase tracking-tighter italic relative z-10">Inventory Health</h3>
                        <div className="flex-1 min-h-[300px] relative z-10">
                            <ErrorBoundary>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={invHealth}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={10}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {invHealth?.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={
                                                        entry.name === 'In Stock' ? '#10b981' :
                                                        entry.name === 'Low Stock' ? '#f59e0b' : '#ef4444'
                                                    } 
                                                    stroke="none"
                                                    className="outline-none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                                                            <p className="text-sm font-black text-primary">{payload[0].value} Product Lines</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-4 mt-8">
                                                    {payload.map((entry, index) => (
                                                        <div key={`legend-${index}`} className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ErrorBoundary>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Products */}
                <div className="lg:col-span-2 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-2xl">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter italic">{isAdmin ? 'Top Performance Products' : 'My Bestsellers'}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Unit Volume Ranking</p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                    <div className="space-y-8">
                        {topProducts?.map((product, i) => (
                            <div key={i} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate('/inventory')}>
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                            <Package size={24} className="group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-background border-2 border-border rounded-full flex items-center justify-center text-[10px] font-black italic">
                                            {i + 1}
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black group-hover:text-primary transition-colors line-clamp-1">{product.name}</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{product.totalQty} units sold</p>
                                            <div className="w-1 h-1 bg-border rounded-full" />
                                            <p className="text-[10px] uppercase tracking-widest font-black text-primary">High Demand</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black tracking-tighter">{formatCurrency(product.totalSales)}</p>
                                    {i === 0 && (
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                                            Platinum Tier
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => navigate('/inventory')}
                        className="w-full mt-12 py-5 bg-primary/5 hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] border border-primary/10"
                    >
                        Access Inventory Intelligence
                    </button>
                </div>
                
                {/* New Quick Action Card */}
                <div className="bg-primary rounded-[2.5rem] p-10 shadow-2xl shadow-primary/30 flex flex-col justify-between text-white relative overflow-hidden group cursor-pointer" onClick={() => navigate('/orders')}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all duration-700" />
                    <div className="relative space-y-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                            <TrendingUp size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-3xl font-black leading-tight uppercase tracking-tighter italic">Strategic<br />Growth</h4>
                            <p className="text-xs font-bold text-white/70 mt-3 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                Accelerate Revenue
                            </p>
                        </div>
                    </div>
                    <div className="relative pt-12">
                        <button className="w-full py-5 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all group-hover:scale-[1.02] group-hover:shadow-white/20">
                            Launch Order Flow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
