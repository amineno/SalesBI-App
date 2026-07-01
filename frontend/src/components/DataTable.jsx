import React from 'react';
import StatusBadge from './StatusBadge';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { MoreVertical } from 'lucide-react';

const DataTable = ({ 
    columns, 
    data, 
    isLoading, 
    onRowClick,
    actions
}) => {
    if (isLoading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState />;

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-secondary/30 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                            {columns.map((col, i) => (
                                <th key={i} className={`px-6 py-4 font-semibold ${col.align === 'right' ? 'text-right' : ''}`}>
                                    {col.header}
                                </th>
                            ))}
                            {actions && <th className="px-6 py-4 font-semibold"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((row, rowIndex) => (
                            <tr 
                                key={row.id || rowIndex} 
                                onClick={() => onRowClick?.(row)}
                                className={`group hover:bg-secondary/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                                        {col.cell ? col.cell(row) : row[col.accessor]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            {actions
                                                .filter(action => !action.show || action.show(row))
                                                .map((action, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => action.onClick(row)}
                                                    className={`p-2 hover:bg-secondary rounded-lg transition-colors ${action.className || 'text-muted-foreground'}`}
                                                    title={action.label}
                                                >
                                                    {action.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
