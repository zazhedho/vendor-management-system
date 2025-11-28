import api from '../api/axios';

const menuService = {
  getAll: (params = {}) => api.get('/api/menus', { params }),
  getById: (id: string) => api.get(`/api/menu/${id}`),
  create: (data: any) => api.post('/api/menu', data),
  update: (id: string, data: any) => api.put(`/api/menu/${id}`, data),
  delete: (id: string) => api.delete(`/api/menu/${id}`),
  getActiveMenus: () => api.get('/api/menus/active'),
  getUserMenus: () => {
    console.log('Calling getUserMenus API...');
    console.log('Token:', localStorage.getItem('token'));
    return api.get('/api/menus/me');
  },
};

export default menuService;
