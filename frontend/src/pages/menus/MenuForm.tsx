import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { menusApi } from '../../api/menus';
import { Save, X } from 'lucide-react';

export const MenuForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    url: '',
    icon: '',
    order_index: 0,
    is_active: true,
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      fetchMenu(id);
    }
  }, [id]);

  const fetchMenu = async (menuId: string) => {
    try {
      const response = await menusApi.getById(menuId);
      if (response.status && response.data) {
        const menu = response.data;
        setFormData({
          name: menu.name,
          display_name: menu.display_name,
          url: menu.url || '',
          icon: menu.icon || '',
          order_index: menu.order_index,
          is_active: menu.is_active,
          description: menu.description || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      setError('Failed to load menu data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isEditMode && id) {
        await menusApi.update(id, formData);
      } else {
        await menusApi.create(formData);
      }
      navigate('/menus');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save menu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Menu' : 'Create New Menu'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update menu information' : 'Create a new navigation menu item'}
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Menu Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="e.g., dashboard, events, vendors"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Use lowercase with underscores or hyphens</p>
          </div>

          <div>
            <label className="label">Display Name *</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Dashboard, Events, Vendors"
              required
            />
          </div>

          <div>
            <label className="label">URL Path</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="input"
              placeholder="e.g., /dashboard, /events"
            />
          </div>

          <div>
            <label className="label">Icon Name</label>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Home, Calendar, Users"
            />
            <p className="text-sm text-gray-500 mt-1">Lucide React icon name</p>
          </div>

          <div>
            <label className="label">Order Index *</label>
            <input
              type="number"
              name="order_index"
              value={formData.order_index}
              onChange={handleChange}
              className="input"
              min="0"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input min-h-24"
              placeholder="Describe this menu item..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (visible in navigation)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/menus')}
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
              <span>{isLoading ? 'Saving...' : 'Save Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
