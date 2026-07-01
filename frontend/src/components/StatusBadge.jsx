import React from 'react';

const StatusBadge = ({ type, text, icon: Icon }) => {
    const variants = {
        success: 'text-green-500 bg-green-500/10',
        destructive: 'text-destructive bg-destructive/10',
        warning: 'text-orange-500 bg-orange-500/10',
        info: 'text-blue-500 bg-blue-500/10',
        secondary: 'text-secondary-foreground bg-secondary'
    };

    return (
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${variants[type] || variants.secondary}`}>
            {Icon && <Icon size={14} />}
            {text}
        </span>
    );
};

export default StatusBadge;
