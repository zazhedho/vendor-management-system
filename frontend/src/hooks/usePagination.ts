import { useState, useCallback } from 'react';

interface UsePaginationReturn {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: (totalPages: number) => void;
  canGoNext: (totalPages: number) => boolean;
  canGoPrev: boolean;
}

export const usePagination = (initialPage: number = 1): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback((totalPages: number) => {
    setCurrentPage(totalPages);
  }, []);

  const canGoNext = useCallback((totalPages: number) => {
    return currentPage < totalPages;
  }, [currentPage]);

  const canGoPrev = currentPage > 1;

  return {
    currentPage,
    setCurrentPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrev,
  };
};
