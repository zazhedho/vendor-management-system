import React, { useState, useEffect } from 'react';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { Plus, Search, Star } from 'lucide-react';
import { Button, Card, Table, Badge } from '../../components/ui';

export const EvaluationList: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvaluations();
  }, [currentPage, searchTerm]);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      const response = await evaluationsApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.status) {
        setEvaluations(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-secondary-400 text-sm">Not rated</span>;

    return (
      <div className="flex items-center gap-1">
        <Star size={16} className="text-warning-400 fill-warning-400" />
        <span className="text-sm font-medium text-secondary-900">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const columns = [
    {
      header: 'Evaluation ID',
      accessor: (evaluation: Evaluation) => (
        <span className="font-mono text-xs text-secondary-600">#{evaluation.id.slice(0, 8)}</span>
      )
    },
    {
      header: 'Rating',
      accessor: (evaluation: Evaluation) => renderStars(evaluation.overall_rating)
    },
    {
      header: 'Comments',
      accessor: (evaluation: Evaluation) => (
        <span className="text-sm text-secondary-600 truncate max-w-xs block">
          {evaluation.comments || '-'}
        </span>
      )
    },
    {
      header: 'Date',
      accessor: (evaluation: Evaluation) => (
        <span className="text-sm text-secondary-600">
          {new Date(evaluation.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (evaluation: Evaluation) => (
        <Button variant="ghost" size="sm">View</Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Evaluations</h1>
          <p className="text-secondary-500">Vendor performance evaluations and ratings</p>
        </div>
        <Button leftIcon={<Plus size={20} />}>
          New Evaluation
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search evaluations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </Card>

      <Table
        data={evaluations}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No evaluations found."
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
