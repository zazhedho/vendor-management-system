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

export function Table<T>({
    data,
    columns,
    keyField,
    isLoading,
    emptyMessage = 'No data available',
    onRowClick
}: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full p-8 text-center text-secondary-500 bg-white rounded-lg border border-secondary-200">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-secondary-200 shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-secondary-50 text-secondary-700 font-medium border-b border-secondary-200">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className={`px-6 py-3 ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                    {data.map((item) => (
                        <tr
                            key={String(item[keyField])}
                            onClick={() => onRowClick && onRowClick(item)}
                            className={`
                hover:bg-secondary-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
                        >
                            {columns.map((col, index) => (
                                <td key={index} className={`px-6 py-4 ${col.className || ''}`}>
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
    );
}
