import React, { useState, useEffect } from 'react';
import { sessionsApi, SessionInfo } from '../../api/sessions';
import { Monitor, Smartphone, Tablet, Laptop, Globe, Trash2, LogOut, CheckCircle } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { toast } from 'react-toastify';

export const SessionList: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; sessionId: string | null; isCurrent: boolean }>({
    isOpen: false,
    sessionId: null,
    isCurrent: false,
  });
  const [revokeAllModal, setRevokeAllModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await sessionsApi.getActiveSessions();
      if (response.status && response.data) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!revokeModal.sessionId) return;

    setIsRevoking(true);
    try {
      const response = await sessionsApi.revokeSession(revokeModal.sessionId);
      if (response.status) {
        toast.success('Session revoked successfully');
        if (revokeModal.isCurrent) {
          window.location.href = '/login';
        } else {
          fetchSessions();
        }
      } else {
        toast.error(response.message || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setIsRevoking(false);
      setRevokeModal({ isOpen: false, sessionId: null, isCurrent: false });
    }
  };

  const handleRevokeAllOther = async () => {
    setIsRevoking(true);
    try {
      const response = await sessionsApi.revokeAllOtherSessions();
      if (response.status) {
        toast.success('All other sessions revoked successfully');
        fetchSessions();
      } else {
        toast.error(response.message || 'Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Failed to revoke other sessions:', error);
      toast.error('Failed to revoke sessions');
    } finally {
      setIsRevoking(false);
      setRevokeAllModal(false);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return <Smartphone size={24} className="text-primary-500" />;
    } else if (info.includes('tablet') || info.includes('ipad')) {
      return <Tablet size={24} className="text-primary-500" />;
    } else if (info.includes('mac') || info.includes('windows') || info.includes('linux')) {
      return <Laptop size={24} className="text-primary-500" />;
    }
    return <Monitor size={24} className="text-primary-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const otherSessionsCount = sessions.filter(s => !s.is_current_session).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Active Sessions</h1>
          <p className="text-secondary-600 mt-1">
            Manage your login sessions across different devices
          </p>
        </div>
        {otherSessionsCount > 0 && (
          <Button
            variant="danger"
            onClick={() => setRevokeAllModal(true)}
          >
            <LogOut size={16} className="mr-2" />
            Logout All Other Devices
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-12">
          <Globe size={48} className="mx-auto text-secondary-400 mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Active Sessions</h3>
          <p className="text-secondary-600">You don't have any active sessions.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions
            .sort((a, b) => (a.is_current_session ? -1 : b.is_current_session ? 1 : 0))
            .map((session) => (
              <Card key={session.session_id} className={`${session.is_current_session ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-primary-50 rounded-lg">
                    {getDeviceIcon(session.device_info)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-secondary-900">{session.device_info}</h3>
                      {session.is_current_session && (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle size={12} />
                          Current Session
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-secondary-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <Globe size={14} />
                        IP: {session.ip}
                      </p>
                      <p>
                        Login: {formatDate(session.login_at)}
                      </p>
                      <p>
                        Last Activity: {getRelativeTime(session.last_activity)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant={session.is_current_session ? 'secondary' : 'danger'}
                      size="sm"
                      onClick={() => setRevokeModal({
                        isOpen: true,
                        sessionId: session.session_id,
                        isCurrent: session.is_current_session,
                      })}
                    >
                      <Trash2 size={14} className="mr-1" />
                      {session.is_current_session ? 'Logout' : 'Revoke'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <ConfirmModal
        show={revokeModal.isOpen}
        onCancel={() => setRevokeModal({ isOpen: false, sessionId: null, isCurrent: false })}
        onConfirm={handleRevokeSession}
        title={revokeModal.isCurrent ? 'Logout from this device?' : 'Revoke this session?'}
        message={
          revokeModal.isCurrent
            ? 'You will be logged out from this device and redirected to the login page.'
            : 'This will log out the selected device. The user will need to log in again on that device.'
        }
        confirmText={revokeModal.isCurrent ? 'Logout' : 'Revoke'}
        variant="danger"
        isLoading={isRevoking}
      />

      <ConfirmModal
        show={revokeAllModal}
        onCancel={() => setRevokeAllModal(false)}
        onConfirm={handleRevokeAllOther}
        title="Logout from all other devices?"
        message={`This will log you out from ${otherSessionsCount} other device${otherSessionsCount > 1 ? 's' : ''}. Only your current session will remain active.`}
        confirmText="Logout All Others"
        variant="danger"
        isLoading={isRevoking}
      />
    </div>
  );
};
