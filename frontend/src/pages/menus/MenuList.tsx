import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menusApi } from '../../api/menus';
import { Menu } from '../../types';
import { Plus, Search, List, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export const MenuList: React.FC = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMenus();
  }, [searchTerm]);

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const response = await menusApi.getAll({ limit: 1000, search: searchTerm });
      if (response.status) {
        setMenus(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu?')) return;
    try {
      await menusApi.delete(id);
      fetchMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
    }
  };

  const sortedMenus = [...menus].sort((a, b) => a.order_index - b.order_index);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-2">Configure system navigation menus</p>
        </div>
        <button onClick={() => navigate('/menus/new')} className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Create Menu</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search menus..."
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
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMenus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{menu.order_index}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <List size={16} className="text-primary-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{menu.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{menu.display_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{menu.url || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {menu.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center space-x-1 w-fit">
                          <ToggleRight size={14} />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center space-x-1 w-fit">
                          <ToggleLeft size={14} />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/menus/${menu.id}/edit`)}
                          className="text-gray-600 hover:text-gray-700"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(menu.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
