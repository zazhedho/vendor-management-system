import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Save, X, User } from 'lucide-react';

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
  const [error, setError] = useState('');

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
      console.error('Failed to fetch user:', error);
      setError('Failed to load user data');
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
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
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
      }
      navigate('/users');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit User' : 'Create New User'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update user information' : 'Add a new user to the system'}
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={40} className="text-primary-600" />
            </div>
          </div>

          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div>
            <label className="label">
              Password {isEditMode ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder={isEditMode ? 'Enter new password to change' : 'Enter password'}
              required={!isEditMode}
            />
          </div>

          <div>
            <label className="label">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input"
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

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/users')}
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
              <span>{isLoading ? 'Saving...' : 'Save User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
