import React, { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
    const [token, setToken] = useState(initialToken);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await resetPassword({ token, password });
            toast.success(response.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
                    <p className="text-muted-foreground">
                        Set a new password with at least 10 characters, upper/lowercase letters, a number, and a symbol.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            required
                            value={token}
                            onChange={(event) => setToken(event.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Reset token"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="New password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        Update Password
                    </button>
                </form>

                <Link to="/login" className="text-sm text-primary font-semibold hover:underline">
                    Return to login
                </Link>
            </div>
        </div>
    );
};

export default ResetPassword;
