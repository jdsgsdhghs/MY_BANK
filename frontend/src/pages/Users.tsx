import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, AdminUser } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TouchableOpacity from '../components/TouchableOpacity';
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
      setError(err instanceof ApiError ? err.message : 'Unable to load users');
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
      setError(err instanceof ApiError ? err.message : 'Save failed');
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
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="users-page">
      <header className="page-header">
        <div>
          <h2>Users</h2>
          <p className="muted">Manage accounts and admin privileges.</p>
        </div>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <section className="card">
        <h3>{editingId ? 'Edit user' : 'New user'}</h3>
        <form onSubmit={handleSubmit} className="user-form">
          <div className="field">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="user-password">
              Password {editingId && <span className="muted">(leave blank to keep current)</span>}
            </label>
            <input
              id="user-password"
              type="password"
              minLength={editingId ? 0 : 8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
              />
              Administrator
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>All users</h3>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : users.length === 0 ? (
          <p className="muted">No users yet.</p>
        ) : (
          <ul className="user-list">
            {users.map((u) => {
              const isAdmin = u.roles.includes('ROLE_ADMIN');
              const isSelf = currentUser?.id === u.id;
              return (
                <li key={u.id}>
                  <div className="user-info">
                    <span className="user-email">{u.email}</span>
                    <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                    {isSelf && <span className="badge badge-self">You</span>}
                  </div>
                  <span className="user-actions">
                    <TouchableOpacity variant="ghost" onClick={() => startEdit(u)}>
                      Edit
                    </TouchableOpacity>
                    <TouchableOpacity
                      variant="danger"
                      onClick={() => handleDelete(u)}
                      disabled={isSelf}
                    >
                      Delete
                    </TouchableOpacity>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
