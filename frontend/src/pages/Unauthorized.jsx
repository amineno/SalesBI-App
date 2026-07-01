import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-lg w-full bg-card border border-border rounded-3xl shadow-2xl p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <ShieldAlert size={30} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You do not have permission to view this page. Contact an administrator if you need access.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
                    >
                        <Home size={18} />
                        Return to Dashboard
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary border border-border font-semibold hover:bg-secondary/80 transition-all"
                    >
                        <LogIn size={18} />
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
