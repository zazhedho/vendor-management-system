import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Save, X, User as UserIcon } from 'lucide-react';
import { Button, Input, Card, Spinner } from '../../components/ui';
import { toast } from 'react-toastify';

export const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'viewer',
  });

  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchRoles();
    if (isEditMode && id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    setIsFetching(true);
    try {
      const response = await usersApi.getById(userId);
      if (response.status && response.data) {
        const user = response.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          password: '',
          role: user.role || 'viewer',
        });
      }
    } catch (error) {
      toast.error('Failed to load user data');
    } finally {
      setIsFetching(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll({ limit: 100 });
      if (response.status) {
        let roles = response.data || [];
        if (currentUser?.role !== 'superadmin') {
          roles = roles.filter((r: Role) => r.name !== 'superadmin');
        }
        setAvailableRoles(roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode && id) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
        };
        await usersApi.update(id, updateData);
        toast.success('User updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users');
          setIsLoading(false);
          return;
        }
        await usersApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role: formData.role,
        });
        toast.success('User created successfully');
      }
      navigate('/users');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditMode ? 'Edit User' : 'Create New User'}
        </h1>
        <p className="text-secondary-500 mt-2">
          {isEditMode ? 'Update user information' : 'Add a new user to the system'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon size={40} className="text-primary-600" />
            </div>
          </div>

          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number (optional)"
          />

          <Input
            label={`Password ${isEditMode ? '(leave blank to keep current)' : ''}`}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isEditMode ? 'Enter new password to change' : 'Enter password'}
            required={!isEditMode}
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              required
            >
              {availableRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.display_name || role.name}
                </option>
              ))}
              {availableRoles.length === 0 && (
                <>
                  {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="vendor">Vendor</option>
                  <option value="viewer">Viewer</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-secondary-100">
            <Button
              variant="secondary"
              onClick={() => navigate('/users')}
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
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
