import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "Search...", className = "" }) => {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
                type="text" 
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
            />
            {value && (
                <button 
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
