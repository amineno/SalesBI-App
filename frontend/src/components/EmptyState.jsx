import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ title = "No data found", message = "Try adjusting your filters or adding a new record.", icon: Icon = PackageOpen }) => (
    <div className="h-[400px] w-full flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center text-muted-foreground/50">
            <Icon size={40} />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground max-w-xs">{message}</p>
        </div>
    </div>
);

export default EmptyState;
