import React from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

const DateRangePicker = ({ value, onChange, className }) => {
    const options = [
        { label: 'Today', value: 'today' },
        { label: 'Last 7 Days', value: '7d' },
        { label: 'Last 30 Days', value: '30d' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Year', value: 'this_year' },
        { label: 'All Time', value: 'all' },
    ];

    return (
        <div className={`relative inline-block ${className}`}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <CalendarIcon size={16} />
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[160px]"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <ChevronDown size={16} />
            </div>
        </div>
    );
};

export default DateRangePicker;
