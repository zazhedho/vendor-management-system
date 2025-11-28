import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rolesApi } from '../../api/roles';
import { Role } from '../../types';
import { Plus, Search, Shield, Eye, Edit, Trash2, Lock } from 'lucide-react';

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

  const handleDelete = async (id: string, isSystem: boolean) => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-2">Manage system roles and permissions</p>
        </div>
        <button
          onClick={() => navigate('/roles/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Role</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
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
      ) : roles.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-600 mb-4">Start by creating your first role</p>
          <button
            onClick={() => navigate('/roles/new')}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Role</span>
          </button>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield size={16} className="text-primary-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{role.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{role.display_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{role.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {role.is_system ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center space-x-1 w-fit">
                            <Lock size={12} />
                            <span>System</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/roles/${role.id}`)}
                            className="text-primary-600 hover:text-primary-700"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/roles/${role.id}/edit`)}
                            className="text-gray-600 hover:text-gray-700"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          {!role.is_system && (
                            <button
                              onClick={() => handleDelete(role.id, role.is_system)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
