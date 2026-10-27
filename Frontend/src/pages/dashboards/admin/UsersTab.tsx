import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import {
  fetchAdminUsers,
  fetchAdminUserDetail,
  suspendAdminUser,
  reactivateAdminUser,
  forceSignoutAdminUser,
  addAdminUserNote,
  changeAdminUserRole,
  AdminUserItem,
  AdminUserDetail,
} from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

export const UsersTab: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected User Detail Modal / Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Modals State
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [targetRole, setTargetRole] = useState('provider');
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 15,
      });
      const list = Array.isArray(res?.users) ? res.users : [];
      setUsers(list);
      setTotalPages(res?.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const openDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    try {
      const detail = await fetchAdminUserDetail(userId);
      setUserDetail(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUserId || !actionReason.trim()) return;
    try {
      setSubmittingAction(true);
      await suspendAdminUser(selectedUserId, actionReason);
      setSuccessMsg('User suspended and all active sessions terminated.');
      setSuspendModalOpen(false);
      setActionReason('');
      loadUsers();
      if (selectedUserId) openDetail(selectedUserId);
    } catch (err: any) {
      setError(err.message || 'Failed to suspend user.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReactivate = async () => {
    if (!selectedUserId || !actionReason.trim()) return;
    try {
      setSubmittingAction(true);
      await reactivateAdminUser(selectedUserId, actionReason);
      setSuccessMsg('User successfully reactivated.');
      setReactivateModalOpen(false);
      setActionReason('');
      loadUsers();
      if (selectedUserId) openDetail(selectedUserId);
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate user.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleForceSignout = async (userId: string) => {
    if (!window.confirm('Force sign-out will immediately terminate all active sessions across devices. Proceed?')) {
      return;
    }
    try {
      await forceSignoutAdminUser(userId);
      setSuccessMsg('User sessions revoked immediately via token_version invalidation.');
    } catch (err: any) {
      setError(err.message || 'Failed to sign out user.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !noteText.trim()) return;
    try {
      await addAdminUserNote(selectedUserId, noteText);
      setNoteText('');
      setSuccessMsg('Administrative internal note appended.');
      openDetail(selectedUserId);
    } catch (err: any) {
      setError(err.message || 'Failed to add note.');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUserId || !stepUpPassword) return;
    try {
      setSubmittingAction(true);
      await changeAdminUserRole(selectedUserId, targetRole, stepUpPassword);
      setSuccessMsg(`User role updated to '${targetRole}'.`);
      setRoleModalOpen(false);
      setStepUpPassword('');
      loadUsers();
      if (selectedUserId) openDetail(selectedUserId);
    } catch (err: any) {
      setError(err.message || 'Failed to change role.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            User Accounts & Session Administration
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Inspect user profiles, suspend access with session termination, and manage roles
          </p>
        </div>

        <button
          onClick={loadUsers}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
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
          Refresh Directory
        </button>
      </div>

      {/* Notifications */}
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

      {/* Search and Filters Bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by full name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', backgroundColor: '#ffffff' }}
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="merchant">Merchant</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', backgroundColor: '#ffffff' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <button
          type="submit"
          style={{
            padding: '8px 18px',
            backgroundColor: 'var(--color-navy-dark)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </form>

      {/* Users Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '14px 18px' }}>User Details</th>
              <th style={{ padding: '14px 18px' }}>Role</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px' }}>Email Verified</th>
              <th style={{ padding: '14px 18px' }}>Joined Date</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Loading user records...
                </td>
              </tr>
            ) : !users || users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No users found matching query filters.
                </td>
              </tr>
            ) : (
              (users || []).map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{u.full_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: u.role.includes('admin') ? '#fef3c7' : '#e0f2fe',
                        color: u.role.includes('admin') ? '#92400e' : '#0369a1',
                      }}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2',
                        color: u.is_active ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {u.is_email_verified ? (
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={14} /> Unverified
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => openDetail(u.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => handleForceSignout(u.id)}
                        title="Force Sign-Out Across Devices"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          backgroundColor: '#fff1f2',
                          border: '1px solid #fecdd3',
                          borderRadius: '6px',
                          color: '#e11d48',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={13} /> Force Out
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  {userDetail?.user.full_name || 'User Profile Inspection'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  User ID: {selectedUserId}
                </p>
              </div>
              <button
                onClick={() => { setSelectedUserId(null); setUserDetail(null); }}
                style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading user details...</div>
            ) : userDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Profile Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-navy-dark)' }}>{userDetail.user.email}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Role</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-navy-dark)' }}>{userDetail.user.role}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Status</span>
                    <div style={{ fontWeight: 700, color: userDetail.user.is_active ? '#15803d' : '#b91c1c' }}>
                      {userDetail.user.is_active ? 'Active' : 'Suspended'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Last Login</span>
                    <div style={{ color: '#475569' }}>
                      {userDetail.user.last_login_at ? new Date(userDetail.user.last_login_at).toLocaleString() : 'Never logged in'}
                    </div>
                  </div>
                </div>

                {/* Suspension & Security Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {userDetail.user.is_active ? (
                    <button
                      onClick={() => setSuspendModalOpen(true)}
                      style={{ padding: '8px 14px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => setReactivateModalOpen(true)}
                      style={{ padding: '8px 14px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Reactivate Account
                    </button>
                  )}

                  <button
                    onClick={() => handleForceSignout(userDetail.user.id)}
                    style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
                  >
                    Force Global Sign-Out
                  </button>

                  {currentAdmin?.role === 'super_admin' && (
                    <button
                      onClick={() => setRoleModalOpen(true)}
                      style={{ padding: '8px 14px', backgroundColor: 'rgba(190, 155, 73, 0.15)', border: '1px solid rgba(190, 155, 73, 0.4)', color: 'var(--color-gold-deep)', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Change Role (Step-Up)
                    </button>
                  )}
                </div>

                {/* Internal Administrative Notes */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '12px' }}>
                    Internal Staff Notes ({userDetail.notes?.length || 0})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
                    {userDetail.notes?.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.84rem' }}>No internal administrative notes yet.</span>
                    ) : (
                      userDetail.notes.map((n) => (
                        <div key={n.id} style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                          <div style={{ color: '#334155', marginBottom: '4px' }}>{n.note}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            By {n.author_name} on {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add note input */}
                  <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Append internal administrative note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    />
                    <button
                      type="submit"
                      style={{ padding: '8px 14px', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Add Note
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>
              Confirm Account Suspension
            </h4>
            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: '0 0 14px' }}>
              Suspending this account will block access immediately, terminate all active browser sessions via <code>token_version</code>, and unpublish any active healthcare services if this user is a provider.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Mandatory Suspension Reason:
              </label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="State specific compliance violation or reason..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !actionReason.trim()}
                onClick={handleSuspend}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {reactivateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d', margin: '0 0 10px' }}>
              Reactivate Account
            </h4>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Reactivation Justification:
              </label>
              <input
                type="text"
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reactivation reason..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setReactivateModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !actionReason.trim()}
                onClick={handleReactivate}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#15803d', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Reactivating...' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-Up Change Role Modal */}
      {roleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Lock size={18} color="var(--color-gold-deep)" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Step-Up Role Modification
              </h4>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 14px' }}>
              Role changes grant or revoke fundamental application access. As a super administrator, please verify your current password to authorize this action.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Target Role:
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
              >
                <option value="customer">Customer</option>
                <option value="merchant">Merchant</option>
                <option value="provider">Provider</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Your Super Admin Password:
              </label>
              <input
                type="password"
                required
                value={stepUpPassword}
                onChange={(e) => setStepUpPassword(e.target.value)}
                placeholder="Enter your current password..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !stepUpPassword}
                onClick={handleChangeRole}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Updating...' : 'Authorize Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersTab;
