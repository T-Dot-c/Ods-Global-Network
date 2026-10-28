import React, { useState, useEffect } from 'react';
import { Bell, Check, Filter, Settings, CheckCircle, ExternalLink } from 'lucide-react';
import {
  fetchInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  InAppNotification,
  NotificationPreferences,
} from '../services/notificationService';

interface NotificationsPageProps {
  onNavigate?: (view: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [total, setTotal] = useState(0);
  const page = 1;

  // Preferences State
  const [prefs, setPrefs] = useState<NotificationPreferences>({});
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchInAppNotifications(page, 15, unreadOnly);
      setNotifications(res.notifications);
      setTotal(res.total);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    setPrefsLoading(true);
    try {
      const data = await fetchNotificationPreferences();
      setPrefs(data);
    } catch {
      // fallback
    } finally {
      setPrefsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      loadNotifications();
    } else {
      loadPreferences();
    }
  }, [activeTab, page, unreadOnly]);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const handleSavePreferences = async () => {
    setPrefsLoading(true);
    try {
      await updateNotificationPreferences(prefs);
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch {
      // handle error
    } finally {
      setPrefsLoading(false);
    }
  };

  const togglePref = (category: string, channel: 'email' | 'in_app') => {
    setPrefs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel],
      },
    }));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '650px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-navy-dark, #0b1f3a)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={26} color="var(--color-gold-mid, #BE9B49)" />
            Notification Center
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
            Stay updated with your bookings, health appointments, payments, and gift cards.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('inbox')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'inbox' ? 'var(--color-navy-dark, #0b1f3a)' : '#f1f5f9',
              color: activeTab === 'inbox' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bell size={16} /> Inbox
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'preferences' ? 'var(--color-navy-dark, #0b1f3a)' : '#f1f5f9',
              color: activeTab === 'preferences' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Settings size={16} /> Preferences
          </button>
        </div>
      </div>

      {activeTab === 'inbox' && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: unreadOnly ? '#e0f2fe' : '#ffffff',
                  color: unreadOnly ? '#0369a1' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Filter size={14} /> {unreadOnly ? 'Showing Unread Only' : `Show All (${total})`}
              </button>
            </div>

            {notifications.some(n => !n.read_at) && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold-mid, #BE9B49)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={16} /> Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Bell size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No notifications found</div>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>You're all caught up with your updates!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '8px',
                    background: n.read_at ? '#ffffff' : '#f0f9ff',
                    border: `1px solid ${n.read_at ? '#e2e8f0' : '#bae6fd'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#0b1f3a',
                          color: '#ffffff',
                        }}
                      >
                        {n.category.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {!n.read_at && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: n.read_at ? 600 : 700, color: '#1e293b', marginBottom: '6px' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {n.rendered_body}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {n.action_url && (
                      <a
                        href={n.action_url}
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#0284c7',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        View Details <ExternalLink size={14} />
                      </a>
                    )}
                    {!n.read_at && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b1f3a', marginBottom: '8px' }}>
            Notification Channels & Categories
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.90rem', marginBottom: '24px' }}>
            Configure where and how you receive updates. Essential security and transactional notices (such as verification, password resets, and booking confirmations) are always delivered.
          </p>

          {prefsLoading && !Object.keys(prefs).length ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading preferences...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.entries(prefs).map(([catKey, channels]) => {
                const isEssential = catKey === 'account_security';
                return (
                  <div
                    key={catKey}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', textTransform: 'capitalize' }}>
                        {catKey.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                        {isEssential
                          ? 'Critical security and account verification notices (Always enabled).'
                          : `Updates regarding your ${catKey.replace('_', ' ')}.`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: isEssential ? 'not-allowed' : 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={channels.email}
                          disabled={isEssential}
                          onChange={() => togglePref(catKey, 'email')}
                        />
                        Email
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: isEssential ? 'not-allowed' : 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={channels.in_app}
                          disabled={isEssential}
                          onChange={() => togglePref(catKey, 'in_app')}
                        />
                        In-App
                      </label>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={handleSavePreferences}
                  disabled={prefsLoading}
                  style={{
                    background: 'var(--color-navy-dark, #0b1f3a)',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {prefsLoading ? 'Saving...' : 'Save Preferences'}
                </button>
                {prefsSuccess && (
                  <span style={{ color: '#059669', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Preferences saved successfully!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
