import React from 'react';
import { Users as UsersIcon, Plus, Search } from 'lucide-react';

export const Users: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card text-center py-12">
        <UsersIcon className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
        <p className="text-gray-600">User management functionality coming soon</p>
      </div>
    </div>
  );
};
