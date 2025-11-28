import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rolesApi } from '../../api/roles';
import { permissionsApi } from '../../api/permissions';
import { menusApi } from '../../api/menus';
import { Permission, Menu } from '../../types';
import { Save, X } from 'lucide-react';

export const RoleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
  });

  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [availableMenus, setAvailableMenus] = useState<Menu[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'menus'>('basic');

  useEffect(() => {
    fetchPermissions();
    fetchMenus();
    if (isEditMode && id) {
      fetchRole(id);
    }
  }, [id]);

  const fetchRole = async (roleId: string) => {
    try {
      const response = await rolesApi.getById(roleId);
      if (response.status && response.data) {
        const role = response.data;
        setFormData({
          name: role.name,
          display_name: role.display_name,
          description: role.description || '',
        });

        const permsResponse = await rolesApi.getPermissions(roleId);
        if (permsResponse.status && permsResponse.data) {
          setSelectedPermissions(permsResponse.data.map((p: Permission) => p.id));
        }

        const menusResponse = await rolesApi.getMenus(roleId);
        if (menusResponse.status && menusResponse.data) {
          setSelectedMenus(menusResponse.data.map((m: Menu) => m.id));
        }
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
      setError('Failed to load role data');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionsApi.getAll({ limit: 1000 });
      if (response.status) {
        setAvailablePermissions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await menusApi.getAll({ limit: 1000 });
      if (response.status) {
        setAvailableMenus(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleMenu = (menuId: string) => {
    setSelectedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let roleId = id;

      if (isEditMode && id) {
        await rolesApi.update(id, formData);
      } else {
        const response = await rolesApi.create(formData);
        roleId = response.data?.id;
      }

      if (roleId) {
        await rolesApi.assignPermissions(roleId, selectedPermissions);
        await rolesApi.assignMenus(roleId, selectedMenus);
      }

      navigate('/roles');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save role');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    const resource = permission.resource || 'other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Role' : 'Create New Role'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update role information and permissions' : 'Create a new role with specific permissions'}
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions ({selectedPermissions.length})
            </button>
            <button
              onClick={() => setActiveTab('menus')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'menus'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menus ({selectedMenus.length})
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="label">Role Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., vendor_manager"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Use lowercase with underscores</p>
              </div>

              <div>
                <label className="label">Display Name *</label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Vendor Manager"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input min-h-24"
                  placeholder="Describe the role and its responsibilities..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">Select permissions for this role:</p>
              {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                <div key={resource} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 capitalize">{resource}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {permission.display_name}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'menus' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select menu items accessible by this role:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableMenus
                  .filter((menu) => menu.is_active)
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((menu) => (
                    <label
                      key={menu.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMenus.includes(menu.id)}
                        onChange={() => toggleMenu(menu.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{menu.display_name}</div>
                        {menu.url && <div className="text-xs text-gray-500">{menu.url}</div>}
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={() => navigate('/roles')}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={20} />
              <span>{isLoading ? 'Saving...' : 'Save Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
