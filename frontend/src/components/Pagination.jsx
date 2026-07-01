import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    currentPage = 1, 
    totalPages = 1, 
    onPageChange,
    totalItems = 0,
    itemsPerPage = 10
}) => {
    if (totalPages <= 1) return null;

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{startItem}</span> to <span className="font-semibold text-foreground">{endItem}</span> of <span className="font-semibold text-foreground">{totalItems}</span> results
            </p>
            
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Basic logic to show limited page numbers if totalPages is large
                        if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'hover:bg-secondary text-muted-foreground'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        } else if (
                            pageNum === currentPage - 2 || 
                            pageNum === currentPage + 2
                        ) {
                            return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
                        }
                        return null;
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
