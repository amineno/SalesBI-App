import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Boundary caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-secondary/20 rounded-3xl border border-dashed border-border min-h-[300px] text-center">
                    <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Visualization Error</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mb-6">Something went wrong while rendering this component.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90"
                    >
                        <RefreshCcw size={14} />
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
