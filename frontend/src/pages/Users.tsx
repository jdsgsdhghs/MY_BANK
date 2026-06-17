import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, AdminUser } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EditIcon, TrashIcon, UserIcon } from '../components/icons';
import './Users.css';

interface FormState {
  email: string;
  password: string;
  isAdmin: boolean;
}

const emptyForm: FormState = { email: '', password: '', isAdmin: false };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.get<AdminUser[]>('/admin/users'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load users');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const email = form.email.trim();
    if (!email) return;
    const roles = form.isAdmin ? ['ROLE_ADMIN'] : ['ROLE_USER'];

    try {
      if (editingId) {
        const payload: Record<string, unknown> = { email, roles };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/users/${editingId}`, payload);
      } else {
        if (!form.password) {
          setError('Password is required for a new user');
          return;
        }
        await api.post('/admin/users', { email, password: form.password, roles });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    }
  }

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    setForm({
      email: u.email,
      password: '',
      isAdmin: u.roles.includes('ROLE_ADMIN'),
    });
  }

  async function handleDelete(u: AdminUser) {
    if (currentUser?.id === u.id) {
      setError('You cannot delete your own account');
      return;
    }
    if (!confirm(`Delete user ${u.email}? All their data will be lost.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Users</h2>
        <p className="subtitle">Account administration — admins only.</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card">
        <div className="card-title">{editingId ? 'Edit user' : 'New user'}</div>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="user-email">Email address</label>
            <input
              id="user-email"
              type="email"
              required
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="user-password">
              Password {editingId && <span className="hint">(blank = unchanged)</span>}
            </label>
            <input
              id="user-password"
              type="password"
              minLength={editingId ? 0 : 8}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label" style={{ visibility: 'hidden' }}>Role</label>
            <div className="checkbox-row">
              <input
                id="user-admin"
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
              />
              <label htmlFor="user-admin">Administrator</label>
            </div>
          </div>
          <div className="field field-submit">
            <label className="field-label" style={{ visibility: 'hidden' }}>.</label>
            <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Existing accounts</div>

        {loading ? (
          <div className="user-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="user-item" key={i}>
                <span className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%' }} />
                <span className="skeleton skeleton-line" style={{ flex: 1, maxWidth: 220 }} />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><UserIcon size={24} /></div>
            <h3>No users</h3>
            <p>Create the first account using the form above.</p>
          </div>
        ) : (
          <div className="user-list">
            {users.map((u) => {
              const isAdmin = u.roles.includes('ROLE_ADMIN');
              const isSelf = currentUser?.id === u.id;
              const initials = u.email.slice(0, 2).toUpperCase();
              return (
                <div className="user-item" key={u.id}>
                  <span className="user-avatar">{initials}</span>
                  <div className="user-main">
                    <div className="user-email">{u.email}</div>
                    <div className="user-badges">
                      <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
                        {isAdmin ? 'Admin' : 'User'}
                      </span>
                      {isSelf && <span className="badge badge-you">You</span>}
                    </div>
                  </div>
                  <span className="actions">
                    <button className="btn-ghost btn-sm btn-icon" aria-label="Edit" onClick={() => startEdit(u)}>
                      <EditIcon size={15} />
                    </button>
                    <button
                      className="btn-danger btn-sm btn-icon"
                      aria-label="Delete"
                      onClick={() => handleDelete(u)}
                      disabled={isSelf}
                      title={isSelf ? 'You cannot delete yourself' : undefined}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
