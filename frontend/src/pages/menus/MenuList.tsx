import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menusApi } from '../../api/menus';
import { Menu } from '../../types';
import { Plus, Search, Edit, Trash2, LayoutGrid } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu, EmptyState } from '../../components/ui';

export const MenuList: React.FC = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, [currentPage, searchTerm]);

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const response = await menusApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.status) {
        setMenus(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await menusApi.delete(deleteId);
      fetchMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      header: 'Display Name',
      accessor: (menu: Menu) => <span className="font-medium text-secondary-900">{menu.display_name}</span>
    },
    {
      header: 'Icon',
      accessor: (menu: Menu) => <span className="font-mono text-xs text-secondary-500">{menu.icon || '-'}</span>
    },
    {
      header: 'Path',
      accessor: (menu: Menu) => <span className="font-mono text-xs text-secondary-600">{menu.path}</span>
    },
    {
      header: 'Order',
      accessor: (menu: Menu) => menu.order_index
    },
    {
      header: 'Status',
      accessor: (menu: Menu) => (
        <Badge variant={menu.is_active ? 'success' : 'secondary'}>
          {menu.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (menu: Menu) => (
        <ActionMenu
          items={[
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/menus/${menu.id}/edit`),
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeleteId(menu.id),
              variant: 'danger',
            },
          ]}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Menu Management</h1>
          <p className="text-secondary-500">Manage application navigation menus</p>
        </div>
        <Button
          onClick={() => navigate('/menus/new')}
          leftIcon={<Plus size={20} />}
        >
          Create Menu
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </Card>

      <Table
        data={menus}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(menu) => navigate(`/menus/${menu.id}/edit`)}
        emptyState={
          <EmptyState
            icon={LayoutGrid}
            title="No Menus Found"
            description="You haven't created any navigation menus yet. Start by creating your first menu item to organize application navigation."
            actionLabel="Create Menu"
            onAction={() => navigate('/menus/new')}
            variant="compact"
          />
        }
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

      <ConfirmModal
        show={!!deleteId}
        title="Delete Menu"
        message="Are you sure you want to delete this menu? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
