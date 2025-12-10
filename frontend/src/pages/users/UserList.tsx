import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Plus, Search, Edit, Trash2, Shield, X, Users } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu, EmptyState } from '../../components/ui';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const canListUsers = hasPermission('users', 'list');
  const canCreateUser = hasPermission('users', 'create');
  const canUpdateUser = hasPermission('users', 'update');
  const canDeleteUser = hasPermission('users', 'delete');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!canListUsers) return;
    fetchUsers();
  }, [currentPage, canListUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = async () => {
    setSearchTerm('');
    setCurrentPage(1);
    
    if (!canListUsers) return;

    // Fetch with empty search
    setIsLoading(true);
    try {
      const response = await usersApi.getAll({
        page: 1,
        limit: 10,
        search: '',
      });

      if (response.status) {
        let userData = response.data || [];
        if (currentUser?.role !== 'superadmin') {
          userData = userData.filter((u: User) => u.role !== 'superadmin');
        }
        setUsers(userData);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!canListUsers) return;

    setIsLoading(true);
    try {
      const response = await usersApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
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

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await usersApi.delete(deleteId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
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
        <ActionMenu
          items={[
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/users/${user.id}/edit`),
              hidden: !canUpdateUser,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeleteId(user.id),
              variant: 'danger',
              hidden: user.id === currentUser?.id || !canDeleteUser,
            },
          ]}
        />
      )
    }
  ];

  if (!canListUsers) {
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
        {canCreateUser && (
          <Button
            onClick={() => navigate('/users/new')}
            leftIcon={<Plus size={20} />}
          >
            Add User
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button onClick={handleSearch} leftIcon={<Search size={20} />}>
            Search
          </Button>
          {searchTerm && (
            <Button onClick={handleReset} variant="secondary" leftIcon={<X size={20} />}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      <Table
        data={users}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={canUpdateUser ? (user) => navigate(`/users/${user.id}/edit`) : undefined}
        emptyState={
          <EmptyState
            icon={Users}
            title="No Users Found"
            description={canCreateUser ? "You haven't added any users yet. Start by creating your first user account to manage system access." : "There are no user records available at the moment."}
            actionLabel={canCreateUser ? "Add User" : undefined}
            onAction={canCreateUser ? () => navigate('/users/new') : undefined}
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
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
