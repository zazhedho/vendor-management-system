import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { menusApi } from '../../api/menus';
import { 
  Save, X, List, ChevronDown,
  LayoutDashboard, Users, Shield, Building2, Calendar, Star, CreditCard, 
  FileText, Settings, BarChart3, TrendingUp, Folder, Inbox, Bell, 
  Mail, Home, Package, Truck, ShoppingCart, Wallet, ClipboardList, 
  Lock, Key, Globe, Map, Bookmark, Heart, Camera, Image, Upload, 
  Download, Cloud, Phone, Calculator, Search, Eye, Edit, Trash2,
  Plus, Minus, Check, AlertTriangle, Info, HelpCircle, Menu, Grid,
  type LucideIcon
} from 'lucide-react';
import { Button, Input, Card, Spinner } from '../../components/ui';
import { toast } from 'react-toastify';

const ICON_LIST: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'bi-speedometer2', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'bi-person-circle', label: 'Profile', icon: Users },
  { value: 'bi-people', label: 'Users', icon: Users },
  { value: 'bi-shield-lock', label: 'Roles', icon: Shield },
  { value: 'bi-building', label: 'Building', icon: Building2 },
  { value: 'bi-calendar-event', label: 'Events', icon: Calendar },
  { value: 'bi-star', label: 'Star', icon: Star },
  { value: 'bi-credit-card', label: 'Payment', icon: CreditCard },
  { value: 'bi-file-earmark-text', label: 'Document', icon: FileText },
  { value: 'bi-list-ul', label: 'List', icon: List },
  { value: 'bi-gear', label: 'Settings', icon: Settings },
  { value: 'bi-bar-chart', label: 'Chart', icon: BarChart3 },
  { value: 'bi-graph-up', label: 'Analytics', icon: TrendingUp },
  { value: 'bi-folder', label: 'Folder', icon: Folder },
  { value: 'bi-inbox', label: 'Inbox', icon: Inbox },
  { value: 'bi-bell', label: 'Notification', icon: Bell },
  { value: 'bi-envelope', label: 'Message', icon: Mail },
  { value: 'bi-house', label: 'Home', icon: Home },
  { value: 'bi-box', label: 'Package', icon: Package },
  { value: 'bi-truck', label: 'Delivery', icon: Truck },
  { value: 'bi-cart', label: 'Cart', icon: ShoppingCart },
  { value: 'bi-wallet', label: 'Wallet', icon: Wallet },
  { value: 'bi-clipboard', label: 'Clipboard', icon: ClipboardList },
  { value: 'bi-lock', label: 'Security', icon: Lock },
  { value: 'bi-key', label: 'Access', icon: Key },
  { value: 'bi-globe', label: 'Global', icon: Globe },
  { value: 'bi-map', label: 'Map', icon: Map },
  { value: 'bi-bookmark', label: 'Bookmark', icon: Bookmark },
  { value: 'bi-heart', label: 'Favorite', icon: Heart },
  { value: 'bi-camera', label: 'Camera', icon: Camera },
  { value: 'bi-image', label: 'Image', icon: Image },
  { value: 'bi-upload', label: 'Upload', icon: Upload },
  { value: 'bi-download', label: 'Download', icon: Download },
  { value: 'bi-cloud', label: 'Cloud', icon: Cloud },
  { value: 'bi-phone', label: 'Phone', icon: Phone },
  { value: 'bi-calculator', label: 'Calculator', icon: Calculator },
  { value: 'bi-search', label: 'Search', icon: Search },
  { value: 'bi-eye', label: 'View', icon: Eye },
  { value: 'bi-pencil', label: 'Edit', icon: Edit },
  { value: 'bi-trash', label: 'Delete', icon: Trash2 },
  { value: 'bi-plus', label: 'Add', icon: Plus },
  { value: 'bi-dash', label: 'Remove', icon: Minus },
  { value: 'bi-check', label: 'Check', icon: Check },
  { value: 'bi-exclamation-triangle', label: 'Warning', icon: AlertTriangle },
  { value: 'bi-info-circle', label: 'Info', icon: Info },
  { value: 'bi-question-circle', label: 'Help', icon: HelpCircle },
  { value: 'bi-grid', label: 'Grid', icon: Grid },
  { value: 'bi-menu', label: 'Menu', icon: Menu },
];

export const MenuForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    path: '',
    icon: '',
    order_index: 0,
    parent_id: '',
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchMenu(id);
    }
  }, [id]);

  const fetchMenu = async (menuId: string) => {
    setIsFetching(true);
    try {
      const response = await menusApi.getById(menuId);
      if (response.status && response.data) {
        const menu = response.data;
        setFormData({
          name: menu.name,
          display_name: menu.display_name,
          path: menu.path || '',
          icon: menu.icon || '',
          order_index: menu.order_index,
          parent_id: menu.parent_id || '',
          is_active: menu.is_active,
        });
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      toast.error('Failed to load menu data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        order_index: Number(formData.order_index),
        parent_id: formData.parent_id || undefined,
      };

      if (isEditMode && id) {
        await menusApi.update(id, submitData);
        toast.success('Menu updated successfully');
      } else {
        await menusApi.create(submitData);
        toast.success('Menu created successfully');
      }
      navigate('/menus');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save menu');
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
          {isEditMode ? 'Edit Menu' : 'Create New Menu'}
        </h1>
        <p className="text-secondary-500 mt-2">
          {isEditMode ? 'Update menu item details' : 'Add a new item to the navigation menu'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <List size={40} className="text-primary-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Internal Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., user_management"
              helperText="Unique identifier for the menu"
              required
            />

            <Input
              label="Display Name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="e.g., User Management"
              required
            />
          </div>

          <Input
            label="Path"
            name="path"
            value={formData.path}
            onChange={handleChange}
            placeholder="e.g., /users"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Icon</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-secondary-200 rounded-lg bg-white hover:bg-secondary-50"
              >
                {formData.icon ? (
                  <>
                    {(() => { const found = ICON_LIST.find(i => i.value === formData.icon); return found ? <found.icon size={20} className="text-primary-600" /> : null; })()}
                    <span className="text-secondary-700 text-sm flex-1 text-left">{ICON_LIST.find(i => i.value === formData.icon)?.label || formData.icon}</span>
                  </>
                ) : (
                  <span className="text-secondary-400 text-sm flex-1 text-left">Select icon...</span>
                )}
                <ChevronDown size={16} className="text-secondary-400" />
              </button>
            </div>

            <Input
              label="Order Index"
              type="number"
              name="order_index"
              value={formData.order_index}
              onChange={handleChange}
              required
            />
          </div>

          {/* Icon Picker Grid */}
          {showIconPicker && (
            <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-secondary-700">Select Icon</span>
                <button type="button" onClick={() => setShowIconPicker(false)} className="text-secondary-400 hover:text-secondary-600">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                {ICON_LIST.map(item => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => { setFormData({ ...formData, icon: item.value }); setShowIconPicker(false); }}
                      title={item.label}
                      className={`p-3 rounded-lg flex items-center justify-center transition-all ${formData.icon === item.value ? 'bg-primary-600 text-white' : 'bg-white hover:bg-primary-50 text-secondary-600 hover:text-primary-600 border border-secondary-200'}`}
                    >
                      <IconComponent size={20} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-5 w-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="font-medium text-secondary-900 cursor-pointer">
              Active Status
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-secondary-100">
            <Button
              variant="secondary"
              onClick={() => navigate('/menus')}
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
              {isEditMode ? 'Update Menu' : 'Create Menu'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
