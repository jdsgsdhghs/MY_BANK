import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, Category } from '../api/client';
import TouchableOpacity from '../components/TouchableOpacity';
import './Categories.css';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
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
      setCategories(await api.get<Category[]>('/categories'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return;
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { title });
      } else {
        await api.post('/categories', { title });
      }
      setTitle('');
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setTitle(c.title);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category? Existing operations will lose their category.')) return;
    try {
      await api.delete(`/categories/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="categories">
      <header className="page-header">
        <div>
          <h2>Categories</h2>
          <p className="muted">Group your operations by theme.</p>
        </div>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <section className="card">
        <h3>{editingId ? 'Edit category' : 'New category'}</h3>
        <form onSubmit={handleSubmit} className="cat-form">
          <div className="field">
            <label htmlFor="cat-title">Title</label>
            <input
              id="cat-title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setEditingId(null); setTitle(''); }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Your categories</h3>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="muted">No categories yet.</p>
        ) : (
          <ul className="cat-list">
            {categories.map((c) => (
              <li key={c.id}>
                <span>{c.title}</span>
                <span className="cat-actions">
                  <TouchableOpacity variant="ghost" onClick={() => startEdit(c)}>
                    Edit
                  </TouchableOpacity>
                  <TouchableOpacity variant="danger" onClick={() => handleDelete(c.id)}>
                    Delete
                  </TouchableOpacity>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
