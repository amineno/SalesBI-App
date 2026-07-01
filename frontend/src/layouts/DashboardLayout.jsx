import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Box, Users, BarChart3, Settings, 
    LogOut, Menu, X, Bell, Search, Sun, Moon, CheckCheck, Trash2, ShoppingBag, ShieldCheck, UserCog
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../ThemeContext';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const [isLogoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        setLogoutDialogOpen(false);
        toast.success('You have been successfully logged out', {
            icon: '👋',
            style: {
                borderLeft: '4px solid #10b981',
            },
        });
    };

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Polling every minute
        return () => clearInterval(interval);
    }, []);

    // Global Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await api.get(`/search?q=${searchQuery}`);
                    setSearchResults(res.data);
                } catch (err) {
                    console.error('Search failed');
                }
            } else {
                setSearchResults(null);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const markAsRead = async (id) => {
        await api.patch(`/notifications/${id}/read`);
        fetchNotifications();
    };

    const clearAll = async () => {
        await api.delete('/notifications/clear');
        setNotifications([]);
    };

    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);
    const isSales = user?.role === 'Sales Representative';
    const isAccountant = user?.role === 'Accountant';

    const navItems = [
        { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/' },
        { icon: <Box size={20}/>, label: 'Inventory', path: '/inventory' },
        { icon: <ShoppingBag size={20}/>, label: 'Orders', path: '/orders' },
        ...(isAdmin || isSales ? [
            { icon: <Users size={20}/>, label: 'Customers', path: '/customers' }
        ] : []),
        ...(isAdmin || isAccountant ? [
            { icon: <BarChart3 size={20}/>, label: 'Reports', path: '/reports' }
        ] : []),
        ...(isAdmin ? [
            { icon: <ShieldCheck size={20}/>, label: 'Audit Logs', path: '/audit-logs' },
            { icon: <UserCog size={20}/>, label: 'Staff Management', path: '/users' }
        ] : []),
        { icon: <Settings size={20}/>, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar & Mobile Overlay remains same ... */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 lg:static lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <img src="/logo.png" alt="SalesBI Logo" className="w-12 h-12 rounded-xl object-cover shadow-lg border border-border/50" />
                        <span className="font-bold text-xl tracking-tight">SalesBI</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => (
                            <Link 
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                    ${location.pathname === item.path 
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                        : 'text-muted-foreground hover:bg-secondary'}
                                `}
                            >
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <button 
                        onClick={() => setLogoutDialogOpen(true)}
                        className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-all mt-auto"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>

                    {/* Modern Logout Confirmation Dialog */}
                    <AnimatePresence>
                        {isLogoutDialogOpen && (
                            <>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setLogoutDialogOpen(false)}
                                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[80]"
                                >
                                    <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                                        {/* Header with gradient */}
                                        <div className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent px-8 pt-8 pb-6">
                                            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
                                                <LogOut className="w-8 h-8 text-destructive" />
                                            </div>
                                            <h2 className="text-2xl font-bold">Logout Confirmation</h2>
                                            <p className="text-muted-foreground mt-1">You are about to end your session</p>
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="px-8 py-6">
                                            <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                    <span>You will be signed out of your account</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                    <span>Unsaved changes will be lost</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="px-8 pb-8 flex gap-3">
                                            <button 
                                                onClick={() => setLogoutDialogOpen(false)}
                                                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-secondary hover:bg-secondary/80 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleLogout}
                                                className="flex-1 py-3.5 px-6 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <LogOut size={18} />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8 shrink-0 relative">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="lg:hidden p-2 hover:bg-secondary rounded-lg" onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="relative hidden md:block w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search products, customers..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {searchResults && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 p-2"
                                    >
                                        <div className="p-2 text-xs font-bold text-muted-foreground border-b border-border mb-2 uppercase">Global Results</div>
                                        {searchResults.products?.map(p => (
                                            <Link key={p.id} to="/inventory" className="flex items-center gap-3 p-2 hover:bg-secondary rounded-xl text-sm">
                                                <Box size={16} className="text-blue-500" /> {p.title}
                                            </Link>
                                        ))}
                                        {searchResults.customers?.map(c => (
                                            <Link key={c.id} to="/customers" className="flex items-center gap-3 p-2 hover:bg-secondary rounded-xl text-sm">
                                                <Users size={16} className="text-orange-500" /> {c.title}
                                            </Link>
                                        ))}
                                        {searchResults.orders?.map(o => (
                                            <Link key={o.id} to="/reports" className="flex items-center gap-3 p-2 hover:bg-secondary rounded-xl text-sm">
                                                <ShoppingBag size={16} className="text-green-500" /> Order #{o.title}
                                            </Link>
                                        ))}
                                        {(!searchResults.products?.length && !searchResults.customers?.length && !searchResults.orders?.length) && <p className="p-4 text-center text-sm text-muted-foreground">No matches found</p>}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-5">
                        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        
                        {/* Notifications Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setNotifOpen(!isNotifOpen)}
                                className={`p-2 rounded-lg hover:bg-secondary relative transition-colors ${isNotifOpen ? 'bg-secondary' : ''}`}
                            >
                                <Bell size={20} />
                                {notifications.some(n => !n.is_read) && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotifOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-4 bg-secondary/30 border-b border-border flex justify-between items-center">
                                                <h4 className="font-bold">Notifications</h4>
                                                <button onClick={clearAll} className="text-muted-foreground hover:text-destructive transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <p className="p-8 text-center text-sm text-muted-foreground">No new updates.</p>
                                                ) : (
                                                    notifications.map(n => {
                                                        const getIcon = (type) => {
                                                            switch(type) {
                                                                case 'ORDER_CREATED': return <ShoppingBag className="text-blue-500" size={18} />;
                                                                case 'ORDER_STATUS_UPDATE': return <CheckCheck className="text-green-500" size={18} />;
                                                                case 'PRODUCT_CREATED': return <Box className="text-purple-500" size={18} />;
                                                                case 'PRODUCT_UPDATED': return <Settings className="text-orange-500" size={18} />;
                                                                case 'PRODUCT_DELETED': return <Trash2 className="text-red-500" size={18} />;
                                                                default: return <Bell className="text-muted-foreground" size={18} />;
                                                            }
                                                        };
                                                        return (
                                                            <div key={n.id} className={`p-4 border-b border-border hover:bg-secondary/20 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                                                                <div className="flex gap-3">
                                                                    <div className="shrink-0 mt-1">
                                                                        {getIcon(n.type)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <p className="text-sm leading-relaxed font-medium">{n.message}</p>
                                                                            {!n.is_read && (
                                                                                <button onClick={() => markAsRead(n.id)} className="shrink-0 text-primary hover:text-primary/70">
                                                                                    <CheckCheck size={16} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground mt-2 block font-bold uppercase tracking-tighter">
                                                                            {new Date(n.created_at).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3 border-l border-border pl-5">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-semibold leading-none">{user?.full_name}</p>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-bold text-primary">
                                {user?.full_name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
