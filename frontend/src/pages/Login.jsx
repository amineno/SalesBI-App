import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8 bg-card p-8 rounded-3xl border border-border shadow-2xl"
            >
                <div className="text-center">
                    <img src="/logo.png" alt="SalesBI Logo" className="mx-auto w-20 h-20 rounded-2xl mb-4 shadow-xl border border-border/50" />
                    <h2 className="text-3xl font-extrabold tracking-tight">Sign In</h2>
                    <p className="mt-2 text-muted-foreground">Enter your credentials to access SalesBI</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="Email address"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={20}/></>}
                    </button>

                    <div className="text-right">
                        <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    
                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register here</Link>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
