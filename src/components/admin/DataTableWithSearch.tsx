import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'boolean';
  filterOptions?: string[];
  render?: (value: any, row: any) => React.ReactNode;
}

interface Filter {
  column: string;
  value: any;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between';
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title: string;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'excel') => void;
  actions?: (row: any) => React.ReactNode;
  pageSize?: number;
}

export const DataTableWithSearch: React.FC<DataTableProps> = ({
  data,
  columns,
  title,
  loading = false,
  onRefresh,
  onExport,
  actions,
  pageSize = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search query
    if (searchQuery.trim()) {
      result = result.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Apply filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const value = row[filter.column];
        if (value === null || value === undefined) return false;

        switch (filter.operator) {
          case 'equals':
            return String(value) === String(filter.value);
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'gt':
            return Number(value) > Number(filter.value);
          case 'lt':
            return Number(value) < Number(filter.value);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortBy, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  };

  const addFilter = (column: string, value: any, operator: Filter['operator'] = 'contains') => {
    const existingFilter = filters.find(f => f.column === column);
    if (existingFilter) {
      setFilters(filters.map(f => f.column === column ? { ...f, value, operator } : f));
    } else {
      setFilters([...filters, { column, value, operator }]);
    }
  };

  const removeFilter = (column: string) => {
    setFilters(filters.filter(f => f.column !== column));
  };

  const clearAllFilters = () => {
    setFilters([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Badge variant="secondary">
                  {filteredAndSortedData.length} of {data.length}
                </Badge>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {onExport && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </>
              )}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across all columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
                {filters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {columns.find(c => c.key === filter.column)?.label}: {String(filter.value)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter(filter.column)}
                    />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid gap-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Advanced Filters</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {columns.filter(col => col.filterable !== false).map(column => (
                    <div key={column.key} className="space-y-2">
                      <label className="text-sm font-medium">{column.label}</label>
                      {column.filterType === 'select' && column.filterOptions ? (
                        <Select
                          value={filters.find(f => f.column === column.key)?.value || ''}
                          onValueChange={(value) => 
                            value ? addFilter(column.key, value, 'equals') : removeFilter(column.key)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All</SelectItem>
                            {column.filterOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={`Filter by ${column.label.toLowerCase()}...`}
                          value={filters.find(f => f.column === column.key)?.value || ''}
                          onChange={(e) => 
                            e.target.value 
                              ? addFilter(column.key, e.target.value, 'contains')
                              : removeFilter(column.key)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      className={`text-left p-4 font-medium ${
                        column.sortable !== false ? 'cursor-pointer hover:bg-muted' : ''
                      }`}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable !== false && (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        {sortBy === column.key && (
                          <Badge variant="secondary" className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                  {actions && <th className="text-left p-4 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                      {filteredAndSortedData.length === 0 && data.length > 0 
                        ? 'No results found for current filters'
                        : 'No data available'
                      }
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      {columns.map(column => (
                        <td key={column.key} className="p-4">
                          {column.render 
                            ? column.render(row[column.key], row)
                            : String(row[column.key] || '')
                          }
                        </td>
                      ))}
                      {actions && (
                        <td className="p-4">
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
        {filteredAndSortedData.length !== data.length && ` (filtered from ${data.length} total)`}
      </div>
    </div>
  );
};