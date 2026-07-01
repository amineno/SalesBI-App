import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => (
    <div className="h-[400px] w-full flex flex-col items-center justify-center gap-6 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
            <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-bold">Something went wrong</h3>
            <p className="text-muted-foreground max-w-xs">{error || "We couldn't load the information at this time. Please try again later."}</p>
        </div>
        {onRetry && (
            <button 
                onClick={onRetry}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
                <RefreshCcw size={18} />
                Try Again
            </button>
        )}
    </div>
);

export default ErrorState;
