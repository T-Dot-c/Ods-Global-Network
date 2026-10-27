import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAdminStaff,
  createAdminStaff,
  updateAdminStaffGroups,
  deactivateAdminStaff,
  AdminStaffItem,
} from '../../../services/adminService';

const AVAILABLE_GROUPS = [
  { id: 'Support', name: 'Support', description: 'Customer and provider lookup, view bookings, add internal notes' },
  { id: 'Compliance', name: 'Compliance', description: 'Inspect KYC documents, make accreditation decisions' },
  { id: 'Catalog Moderation', name: 'Catalog Moderation', description: 'Moderate provider healthcare offerings and categories' },
  { id: 'Finance', name: 'Finance', description: 'View financial ledger, initiate refunds, two-person authorization' },
  { id: 'Operations', name: 'Operations', description: 'Booking overrides, dispute flags, gift card oversight' },
  { id: 'User Administration', name: 'User Administration', description: 'Suspend accounts, session termination, force signout' },
  { id: 'System', name: 'System', description: 'Platform settings, staff provisioning, full audit ledger view' },
];

export const StaffAccountsTab: React.FC = () => {
  const [staff, setStaff] = useState<AdminStaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Staff Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState('staff');
  const [newTempPassword, setNewTempPassword] = useState('');
  const [newSelectedGroups, setNewSelectedGroups] = useState<string[]>(['Support']);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Groups Modal State
  const [selectedStaff, setSelectedStaff] = useState<AdminStaffItem | null>(null);
  const [editGroupsModalOpen, setEditGroupsModalOpen] = useState(false);
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);

  // Deactivate Modal State
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminStaff();
      const list = Array.isArray(data) ? data : [];
      setStaff(list);
    } catch (err: any) {
      setError(err.message || 'Failed to list staff accounts.');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newTempPassword || !stepUpPassword) return;
    try {
      setSubmitting(true);
      await createAdminStaff({
        email: newEmail.trim(),
        full_name: newName.trim(),
        phone: newPhone.trim() || undefined,
        admin_level: newAdminLevel,
        temporary_password: newTempPassword,
        current_password: stepUpPassword,
        group_ids: newSelectedGroups,
      });
      setSuccessMsg(`Staff account ${newEmail} provisioned successfully with mandatory first-login password change.`);
      setCreateModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      setNewTempPassword('');
      setStepUpPassword('');
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditGroups = (s: AdminStaffItem) => {
    setSelectedStaff(s);
    setEditGroupIds(s.groups.map(g => g.name));
    setEditGroupsModalOpen(true);
  };

  const handleUpdateGroups = async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      await updateAdminStaffGroups(selectedStaff.id, editGroupIds);
      setSuccessMsg(`Permissions updated for ${selectedStaff.full_name}.`);
      setEditGroupsModalOpen(false);
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to update groups.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedStaff || !deactivateReason.trim()) return;
    try {
      setSubmitting(true);
      await deactivateAdminStaff(selectedStaff.id, deactivateReason.trim());
      setSuccessMsg(`Staff account ${selectedStaff.email} deactivated.`);
      setDeactivateModalOpen(false);
      setDeactivateReason('');
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGroup = (groupName: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(groupName)) {
      setList(list.filter(g => g !== groupName));
    } else {
      setList([...list, groupName]);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Administrative Staff & Granular RBAC Permissions
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Provision staff accounts, configure role groups, and manage least-privilege permissions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-navy-dark)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Provision Staff Account
          </button>

          <button
            onClick={loadStaff}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', fontSize: '0.88rem' }}>
          {successMsg}
        </div>
      )}

      {/* Staff Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '14px 18px' }}>Staff Member</th>
              <th style={{ padding: '14px 18px' }}>Admin Level</th>
              <th style={{ padding: '14px 18px' }}>Assigned Permission Groups</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px' }}>Last Login</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && staff.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading staff accounts...</td></tr>
            ) : !staff || staff.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No administrative accounts found.</td></tr>
            ) : (
              (staff || []).map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{s.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                      backgroundColor: s.role === 'super_admin' ? '#fef3c7' : '#e0f2fe',
                      color: s.role === 'super_admin' ? '#92400e' : '#0369a1',
                      textTransform: 'uppercase',
                    }}>
                      {s.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {s.role === 'super_admin' ? (
                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.74rem', fontWeight: 700 }}>
                          * All Permissions (Super Admin)
                        </span>
                      ) : s.groups.length === 0 ? (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No groups assigned</span>
                      ) : (
                        s.groups.map(g => (
                          <span key={g.id} style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155', fontSize: '0.74rem', fontWeight: 600 }}>
                            {g.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                      backgroundColor: s.is_active ? '#dcfce7' : '#fee2e2',
                      color: s.is_active ? '#15803d' : '#b91c1c',
                    }}>
                      {s.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.82rem' }}>
                    {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {s.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() => openEditGroups(s)}
                            style={{ padding: '5px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Permissions
                          </button>
                          {s.is_active && (
                            <button
                              onClick={() => { setSelectedStaff(s); setDeactivateModalOpen(true); }}
                              style={{ padding: '5px 10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Deactivate
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Provision Staff Modal */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handleCreateStaff} style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '26px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 14px' }}>
              Provision Administrative Staff Account
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Full Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sara Bekele"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Email Address:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@ods.com"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Phone (Optional):</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+251911..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Admin Role Level:</label>
                <select
                  value={newAdminLevel}
                  onChange={(e) => setNewAdminLevel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
                >
                  <option value="staff">Staff (Scoped Permissions)</option>
                  <option value="super_admin">Super Admin (Unrestricted)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Temporary Password:</label>
              <input
                type="password"
                required
                minLength={8}
                value={newTempPassword}
                onChange={(e) => setNewTempPassword(e.target.value)}
                placeholder="Temporary login password (min 8 chars)..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                * Staff member will be flagged with <code>must_change_password</code> on first login.
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Assign Permission Groups:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {AVAILABLE_GROUPS.map(g => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newSelectedGroups.includes(g.id)}
                      onChange={() => toggleGroup(g.id, newSelectedGroups, setNewSelectedGroups)}
                    />
                    <strong>{g.name}</strong> — <span style={{ color: '#64748b' }}>{g.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Your Password (Step-Up Authorization):</label>
              <input
                type="password"
                required
                value={stepUpPassword}
                onChange={(e) => setStepUpPassword(e.target.value)}
                placeholder="Confirm your super admin password..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Provisioning...' : 'Provision Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Groups Modal */}
      {editGroupsModalOpen && selectedStaff && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 6px' }}>
              Update Permissions for {selectedStaff.full_name}
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 14px' }}>
              Select assigned role groups. Changes take effect on the very next HTTP request without session re-login.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {AVAILABLE_GROUPS.map(g => (
                <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editGroupIds.includes(g.id)}
                    onChange={() => toggleGroup(g.id, editGroupIds, setEditGroupIds)}
                  />
                  <span><strong>{g.name}</strong> — {g.description}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditGroupsModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdateGroups}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {deactivateModalOpen && selectedStaff && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>
              Deactivate Staff Account
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 14px' }}>
              Deactivating <strong>{selectedStaff.email}</strong> will revoke all admin access and immediately terminate active sessions.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Deactivation Reason:
              </label>
              <input
                type="text"
                required
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Reason for deactivation..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !deactivateReason.trim()}
                onClick={handleDeactivate}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffAccountsTab;
