import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "Loading data..." }) => (
    <div className="h-[400px] w-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-muted-foreground font-medium">{message}</p>
    </div>
);

export default LoadingState;
