import React, { useState, useEffect } from 'react';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { Plus, Search, Star } from 'lucide-react';

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
    if (!rating) return <span className="text-gray-400">Not rated</span>;

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-gray-600 mt-2">Vendor performance evaluations and ratings</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>New Evaluation</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search evaluations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="card text-center py-12">
          <Star className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No evaluations found</h3>
          <p className="text-gray-600">Start evaluating vendor performance</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Evaluation #{evaluation.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(evaluation.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Event ID:</span>
                        <span className="ml-2 font-mono text-xs">{evaluation.event_id.slice(0, 12)}...</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vendor ID:</span>
                        <span className="ml-2 font-mono text-xs">{evaluation.vendor_id.slice(0, 12)}...</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Evaluator:</span>
                        <span className="ml-2 font-mono text-xs">{evaluation.evaluator_user_id.slice(0, 12)}...</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <span className="ml-2">{renderStars(evaluation.overall_rating)}</span>
                      </div>
                    </div>

                    {evaluation.comments && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{evaluation.comments}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    <button className="btn btn-secondary text-sm py-2 flex-1 lg:flex-none">
                      View Details
                    </button>
                    <button className="btn btn-primary text-sm py-2 flex-1 lg:flex-none">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
