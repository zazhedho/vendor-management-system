import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rolesApi } from '../../api/roles';
import { permissionsApi } from '../../api/permissions';
import { menusApi } from '../../api/menus';
import { Permission, Menu } from '../../types';
import { Save, X, Shield, List, Lock } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { toast } from 'react-toastify';

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

        if (role.permission_ids) {
          setSelectedPermissions(role.permission_ids);
        }

        if (role.menu_ids) {
          setSelectedMenus(role.menu_ids);
        }
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
      toast.error('Failed to load role data');
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

      toast.success(isEditMode ? 'Role updated successfully' : 'Role created successfully');
      navigate('/roles');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save role');
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
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Role' : 'Create New Role'}
        </h1>
        <p className="text-secondary-500 mt-2">
          {isEditMode ? 'Update role information and permissions' : 'Create a new role with specific permissions'}
        </p>
      </div>

      <Card>
        <div className="border-b border-secondary-200 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'basic'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
            >
              <Shield size={16} />
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'permissions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
            >
              <Lock size={16} />
              Permissions ({selectedPermissions.length})
            </button>
            <button
              onClick={() => setActiveTab('menus')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'menus'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
            >
              <List size={16} />
              Menus ({selectedMenus.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div className="space-y-6 max-w-2xl">
              <Input
                label="Role Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., vendor_manager"
                helperText="Use lowercase with underscores"
                required
              />

              <Input
                label="Display Name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="e.g., Vendor Manager"
                required
              />

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none min-h-24"
                  placeholder="Describe the role and its responsibilities..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <p className="text-sm text-secondary-600">Select permissions for this role:</p>
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                  <div key={resource} className="border border-secondary-200 rounded-lg overflow-hidden">
                    <div className="bg-secondary-50 px-4 py-2 border-b border-secondary-200">
                      <h3 className="font-semibold text-secondary-900 capitalize">{resource}</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className={`
                            flex items-start space-x-3 cursor-pointer p-2 rounded-lg transition-colors
                            ${selectedPermissions.includes(permission.id) ? 'bg-primary-50 border border-primary-100' : 'hover:bg-secondary-50 border border-transparent'}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-secondary-900">
                              {permission.display_name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-secondary-500 mt-0.5">{permission.description}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'menus' && (
            <div className="space-y-4">
              <p className="text-sm text-secondary-600">Select menu items accessible by this role:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableMenus
                  .filter((menu) => menu.is_active)
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((menu) => (
                    <label
                      key={menu.id}
                      className={`
                        flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all
                        ${selectedMenus.includes(menu.id)
                          ? 'bg-primary-50 border-primary-200 shadow-sm'
                          : 'border-secondary-200 hover:bg-secondary-50'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMenus.includes(menu.id)}
                        onChange={() => toggleMenu(menu.id)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-secondary-900">{menu.display_name}</div>
                        {menu.url && <div className="text-xs text-secondary-500 font-mono mt-0.5">{menu.url}</div>}
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-secondary-100 mt-8">
            <Button
              variant="secondary"
              onClick={() => navigate('/roles')}
              type="button"
              leftIcon={<X size={16} />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save size={16} />}
            >
              {isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
