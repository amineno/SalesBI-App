import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../ThemeContext';
import { 
    User, Bell, Shield, Palette, 
    Moon, Sun, Check, Mail, Key, Loader2,
    Lock, AlertCircle, ToggleLeft, ToggleRight, Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { motion } from 'framer-motion';

const Settings = () => {
    const { user, refreshUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    
    // Profile State
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    // Sync state with user data
    React.useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    // Security State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Notification State
    const [notifSettings, setNotifSettings] = useState({
        emailAlerts: true,
        orderUpdates: true,
        inventoryAlerts: true,
        systemNews: false
    });

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put('/auth/update-profile', { 
                full_name: fullName,
                phone: phone 
            });
            await refreshUser();
            toast.success('Profile updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setIsLoading(true);
        try {
            await api.put('/auth/update-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            toast.success('Password updated successfully!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleNotif = (key) => {
        setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success(`Notification preference updated`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">System Settings</h1>
                    <p className="text-muted-foreground mt-1 font-medium">Manage your enterprise account and personal preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <div className="space-y-2">
                    <SettingNav 
                        icon={<User size={18}/>} 
                        label="Profile" 
                        active={activeTab === 'profile'} 
                        onClick={() => setActiveTab('profile')}
                    />
                    <SettingNav 
                        icon={<Palette size={18}/>} 
                        label="Appearance" 
                        active={activeTab === 'appearance'} 
                        onClick={() => setActiveTab('appearance')}
                    />
                    <SettingNav 
                        icon={<Bell size={18}/>} 
                        label="Notifications" 
                        active={activeTab === 'notifications'} 
                        onClick={() => setActiveTab('notifications')}
                    />
                    <SettingNav 
                        icon={<Shield size={18}/>} 
                        label="Security" 
                        active={activeTab === 'security'} 
                        onClick={() => setActiveTab('security')}
                    />
                </div>

                {/* Content */}
                <div className="md:col-span-2 space-y-6">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0" />
                                <h3 className="font-bold flex items-center gap-3 text-xl relative">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <User size={22} />
                                    </div>
                                    Personal Information
                                </h3>
                                <div className="space-y-6 relative">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">Full Name</label>
                                            <input 
                                                className="w-full bg-secondary/30 border border-border rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold" 
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                                <input 
                                                    className="w-full bg-secondary/30 border border-border rounded-2xl pl-12 pr-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold" 
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                                <input 
                                                    className="w-full bg-secondary/10 border border-border rounded-2xl pl-12 pr-5 py-3.5 text-muted-foreground cursor-not-allowed font-semibold" 
                                                    value={user?.email || ''} 
                                                    disabled
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 px-2">
                                                <AlertCircle size={14} className="text-muted-foreground" />
                                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Email changes require admin verification</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Check size={22} />}
                                    Update Profile Settings
                                </button>
                            </form>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8">
                                <h3 className="font-bold flex items-center gap-3 text-xl">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Palette size={22} />
                                    </div>
                                    Interface Customization
                                </h3>
                                <div className="space-y-6">
                                    <p className="text-muted-foreground font-medium">Choose your preferred theme for the dashboard interface.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ThemeOption 
                                            active={theme === 'light'} 
                                            onClick={() => theme === 'dark' && toggleTheme()}
                                            icon={<Sun size={24} />}
                                            label="Light Mode"
                                        />
                                        <ThemeOption 
                                            active={theme === 'dark'} 
                                            onClick={() => theme === 'light' && toggleTheme()}
                                            icon={<Moon size={24} />}
                                            label="Dark Mode"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8">
                                <h3 className="font-bold flex items-center gap-3 text-xl">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Bell size={22} />
                                    </div>
                                    Alert Preferences
                                </h3>
                                <div className="space-y-2">
                                    <NotifToggle 
                                        title="Email Notifications" 
                                        description="Receive weekly summaries and important account updates."
                                        enabled={notifSettings.emailAlerts}
                                        onToggle={() => toggleNotif('emailAlerts')}
                                    />
                                    <NotifToggle 
                                        title="Order Updates" 
                                        description="Real-time alerts when new orders are placed or status changes."
                                        enabled={notifSettings.orderUpdates}
                                        onToggle={() => toggleNotif('orderUpdates')}
                                    />
                                    <NotifToggle 
                                        title="Inventory Alerts" 
                                        description="Instant notification when products reach low stock thresholds."
                                        enabled={notifSettings.inventoryAlerts}
                                        onToggle={() => toggleNotif('inventoryAlerts')}
                                    />
                                    <NotifToggle 
                                        title="System News" 
                                        description="Updates about new features and scheduled maintenance."
                                        enabled={notifSettings.systemNews}
                                        onToggle={() => toggleNotif('systemNews')}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handleUpdatePassword} className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8">
                                <h3 className="font-bold flex items-center gap-3 text-xl">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Shield size={22} />
                                    </div>
                                    Security & Privacy
                                </h3>
                                <div className="space-y-6">
                                    <div className="bg-secondary/30 rounded-2xl p-5 border border-border flex gap-4">
                                        <Lock className="text-primary shrink-0" size={24} />
                                        <div>
                                            <p className="font-bold text-sm">Change Access Password</p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Passwords must be at least 8 characters and include at least one uppercase letter and one number.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">Current Password</label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                                <input 
                                                    type="password"
                                                    required
                                                    className="w-full bg-secondary/30 border border-border rounded-2xl pl-12 pr-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold" 
                                                    value={passwords.currentPassword}
                                                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">New Password</label>
                                                <input 
                                                    type="password"
                                                    required
                                                    className="w-full bg-secondary/30 border border-border rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold" 
                                                    value={passwords.newPassword}
                                                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Confirm New Password</label>
                                                <input 
                                                    type="password"
                                                    required
                                                    className="w-full bg-secondary/30 border border-border rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold" 
                                                    value={passwords.confirmPassword}
                                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Shield size={22} />}
                                    Apply Security Changes
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const SettingNav = ({ icon, label, active = false, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black text-sm border ${active ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-transparent border-transparent hover:bg-secondary text-muted-foreground'}`}
    >
        {icon}
        {label}
    </button>
);

const ThemeOption = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-4 p-8 rounded-3xl border-2 transition-all ${active ? 'border-primary bg-primary/5 scale-105 shadow-lg' : 'border-border hover:border-primary/30 grayscale hover:grayscale-0'}`}
    >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${active ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
            {icon}
        </div>
        <span className={`text-sm font-black ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
        {active && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
    </button>
);

const NotifToggle = ({ title, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-5 hover:bg-secondary/20 rounded-2xl transition-colors group">
        <div className="space-y-1">
            <p className="font-bold text-sm group-hover:text-primary transition-colors">{title}</p>
            <p className="text-xs text-muted-foreground font-medium">{description}</p>
        </div>
        <button onClick={onToggle} className={`transition-all ${enabled ? 'text-primary' : 'text-muted-foreground opacity-30 hover:opacity-100'}`}>
            {enabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
        </button>
    </div>
);

export default Settings;
