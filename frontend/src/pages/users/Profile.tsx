import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield, Calendar, Save } from 'lucide-react';
import { Card, Button, Input, Spinner } from '../../components/ui';
import { toast } from 'react-toastify';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white border-none">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <User className="text-white" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-primary-100">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={16} className="text-primary-200" />
              <span className="text-primary-100 capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </Card>

      {isEditing ? (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon={<User size={18} />}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail size={18} />}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone size={18} />}
            />
            <div className="flex gap-3">
              <Button type="submit" isLoading={isLoading} leftIcon={<Save size={16} />}>
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
              <User size={20} className="text-secondary-400" />
              <div>
                <p className="text-xs text-secondary-500">Full Name</p>
                <p className="text-secondary-900 font-medium">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
              <Mail size={20} className="text-secondary-400" />
              <div>
                <p className="text-xs text-secondary-500">Email Address</p>
                <p className="text-secondary-900 font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
              <Phone size={20} className="text-secondary-400" />
              <div>
                <p className="text-xs text-secondary-500">Phone Number</p>
                <p className="text-secondary-900 font-medium">{user.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
              <Calendar size={20} className="text-secondary-400" />
              <div>
                <p className="text-xs text-secondary-500">Member Since</p>
                <p className="text-secondary-900 font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
