import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

const TableComponent = <T,>({
    data,
    columns,
    keyField,
    isLoading,
    emptyMessage = 'No data available',
    onRowClick
}: TableProps<T>) => {
    if (isLoading) {
        return (
            <div className="w-full rounded-xl border border-secondary-200 bg-white shadow-soft overflow-hidden">
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-secondary-200"></div>
                        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm text-secondary-500 font-medium">Loading data...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full rounded-xl border border-dashed border-secondary-300 bg-secondary-50/50 backdrop-blur-sm overflow-hidden">
                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center shadow-inner">
                        <svg className="w-6 h-6 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-semibold text-secondary-900 mb-1">No data found</h3>
                        <p className="text-sm text-secondary-500">{emptyMessage}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-secondary-200 shadow-soft bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-secondary-50/80 border-b border-secondary-200 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 bg-white">
                        {data.map((item, rowIndex) => (
                            <tr
                                key={String(item[keyField])}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`
                                    group transition-all duration-200
                                    hover:bg-primary-50/30
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-secondary-50/30'}
                                `}
                            >
                                {columns.map((col, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`px-6 py-3 text-sm text-secondary-700 group-hover:text-secondary-900 transition-colors ${col.className || ''}`}
                                    >
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Table = React.memo(TableComponent) as typeof TableComponent;
