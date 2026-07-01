import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await forgotPassword(email);
            setResetToken(response.resetToken || '');
            toast.success(response.message);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to request password reset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
                    <p className="text-muted-foreground">
                        Enter your email and we will issue a password reset token.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Email address"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        Request Reset
                    </button>
                </form>

                {resetToken && (
                    <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
                        <p className="text-sm font-semibold">Development Reset Token</p>
                        <code className="block text-xs break-all text-muted-foreground">{resetToken}</code>
                        <Link to={`/reset-password?token=${resetToken}`} className="text-sm text-primary font-semibold hover:underline">
                            Continue to reset password
                        </Link>
                    </div>
                )}

                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    <ArrowLeft size={16} />
                    Back to login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
