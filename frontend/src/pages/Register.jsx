import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success('Account created! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full space-y-8 bg-card p-8 rounded-3xl border border-border shadow-2xl"
            >
                <div className="text-center">
                    <img src="/logo.png" alt="SalesBI Logo" className="mx-auto w-20 h-20 rounded-2xl mb-4 shadow-xl border border-border/50" />
                    <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
                    <p className="mt-2 text-muted-foreground">Join the elite Sales Intelligence network</p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Full Name"
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Email address"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Strong Password"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Password must have at least 10 characters, upper/lowercase letters, a number, and a symbol.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Get Started <ArrowRight size={20}/></>}
                    </button>
                    
                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
