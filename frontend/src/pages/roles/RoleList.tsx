import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api/roles';
import { Role } from '../../types';
import { Plus, Shield, Edit, Trash2, Lock, UserCheck } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu, EmptyState } from '../../components/ui';
import { useDebounce } from '../../hooks';
import { toast } from 'react-toastify';

export const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: response, isLoading } = useQuery({
    queryKey: ['roles', { page: currentPage, search: debouncedSearch }],
    queryFn: () => rolesApi.getAll({
      page: currentPage,
      limit: 10,
      search: debouncedSearch,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteId(null);
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete role');
    },
  });

  const roles = response?.data || [];
  const totalPages = response?.total_pages || 1;

  const columns = [
    {
      header: 'Role Name',
      accessor: (role: Role) => (
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary-500" />
          <span className="font-medium text-secondary-900">{role.name}</span>
        </div>
      )
    },
    {
      header: 'Display Name',
      accessor: (role: Role) => role.display_name
    },
    {
      header: 'Description',
      accessor: (role: Role) => <span className="text-secondary-500 text-sm truncate max-w-xs block">{role.description || '-'}</span>
    },
    {
      header: 'Type',
      accessor: (role: Role) => (
        role.is_system ? (
          <Badge variant="info" className="flex items-center gap-1 w-fit">
            <Lock size={10} /> System
          </Badge>
        ) : (
          <Badge variant="secondary">Custom</Badge>
        )
      )
    },
    {
      header: 'Actions',
      accessor: (role: Role) => (
        <ActionMenu
          items={[
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/roles/${role.id}/edit`),
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeleteId(role.id),
              variant: 'danger',
              hidden: role.is_system,
            },
          ]}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Roles Management</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage system roles and permissions</p>
        </div>
        <Button
          onClick={() => navigate('/roles/new')}
          leftIcon={<Plus size={20} />}
        >
          Create Role
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table
          data={roles}
          columns={columns}
          keyField="id"
          isLoading={isLoading}
          onRowClick={(role) => navigate(`/roles/${role.id}/edit`)}
          emptyState={
            <EmptyState
              icon={UserCheck}
              title="No Roles Found"
              description="You haven't created any custom roles yet. Start by creating your first role to manage permissions effectively."
              actionLabel="Create Role"
              onAction={() => navigate('/roles/new')}
              variant="compact"
            />
          }
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-100 bg-secondary-50">
            <span className="text-xs text-secondary-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmModal
        show={!!deleteId}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
