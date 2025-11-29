import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rolesApi } from '../../api/roles';
import { Role } from '../../types';
import { Plus, Search, Shield, Edit, Trash2, Lock, Eye } from 'lucide-react';
import { Button, Card, Table, Badge } from '../../components/ui';

export const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRoles();
  }, [currentPage, searchTerm]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await rolesApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.status) {
        setRoles(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, isSystem: boolean) => {
    e.stopPropagation();
    if (isSystem) {
      alert('System roles cannot be deleted');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      await rolesApi.delete(id);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

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
      accessor: 'display_name'
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/roles/${role.id}/edit`); }}
          >
            <Edit size={16} />
          </Button>
          {!role.is_system && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
              onClick={(e) => handleDelete(e, role.id, role.is_system)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Roles Management</h1>
          <p className="text-secondary-500">Manage system roles and permissions</p>
        </div>
        <Button
          onClick={() => navigate('/roles/new')}
          leftIcon={<Plus size={20} />}
        >
          Create Role
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </Card>

      <Table
        data={roles}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(role) => navigate(`/roles/${role.id}/edit`)}
        emptyMessage="No roles found."
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
