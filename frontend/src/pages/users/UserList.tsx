import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react';
import { Button, Card, Table, Badge } from '../../components/ui';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter || undefined,
      });

      if (response.status) {
        let userData = response.data || [];
        if (currentUser?.role !== 'superadmin') {
          userData = userData.filter((u: User) => u.role !== 'superadmin');
        }
        // Superadmin sees everyone, including other superadmins
        setUsers(userData);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersApi.delete(id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'primary';
      case 'admin': return 'danger';
      case 'staff': return 'info';
      case 'vendor': return 'success';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      header: 'User',
      accessor: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-secondary-900">
              {user.name}
              {user.id === currentUser?.id && <span className="ml-2 text-xs text-secondary-500">(You)</span>}
            </p>
            <p className="text-xs text-secondary-500">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: (user: User) => (
        <Badge variant={getRoleVariant(user.role)} className="capitalize">
          {user.role}
        </Badge>
      )
    },
    {
      header: 'Phone',
      accessor: (user: User) => <span className="text-secondary-600">{user.phone || '-'}</span>
    },
    {
      header: 'Created At',
      accessor: (user: User) => new Date(user.created_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessor: (user: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/users/${user.id}/edit`); }}
          >
            <Edit size={16} />
          </Button>
          {user.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
              onClick={(e) => handleDelete(e, user.id)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      )
    }
  ];

  if (!hasRole(['admin', 'superadmin'])) {
    return (
      <Card className="text-center py-12">
        <Shield className="mx-auto text-secondary-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Access Denied</h3>
        <p className="text-secondary-600">Only administrators can view this page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Users</h1>
          <p className="text-secondary-500">Manage user accounts and permissions</p>
        </div>
        <Button
          onClick={() => navigate('/users/new')}
          leftIcon={<Plus size={20} />}
        >
          Add User
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-secondary-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">All Roles</option>
            {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="vendor">Vendor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </Card>

      <Table
        data={users}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(user) => navigate(`/users/${user.id}/edit`)}
        emptyMessage="No users found."
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
