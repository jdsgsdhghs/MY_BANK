import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, Category } from '../api/client';
import { EditIcon, ListIcon, TrashIcon } from '../components/icons';
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
      setError(err instanceof ApiError ? err.message : 'Chargement des catégories impossible');
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
      setError(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setTitle(c.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle('');
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette catégorie ? Les opérations associées perdront leur catégorie.')) return;
    try {
      await api.delete(`/categories/${id}`);
      if (editingId === id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de la suppression');
    }
  }

  return (
    <div className="categories">
      <div className="page-header">
        <h2>Catégories</h2>
        <p className="subtitle">Organisez vos opérations pour mieux lire vos dépenses.</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card">
        <div className="card-title">{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</div>
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="cat-title">Intitulé</label>
            <input
              id="cat-title"
              type="text"
              required
              maxLength={100}
              placeholder="ex. Abonnements"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={cancelEdit}>Annuler</button>
          )}
        </form>
      </div>

      <div className="card">
        <div className="card-title">Vos catégories</div>

        {loading ? (
          <div className="category-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="category-item" key={i}>
                <span className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%' }} />
                <span className="skeleton skeleton-line" style={{ flex: 1, maxWidth: 160 }} />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ListIcon size={24} /></div>
            <h3>Aucune catégorie</h3>
            <p>Créez votre première catégorie pour classer vos opérations.</p>
          </div>
        ) : (
          <div className="category-list">
            {categories.map((c) => (
              <div className={`category-item ${editingId === c.id ? 'editing' : ''}`} key={c.id}>
                <span className="dot" />
                <span className="title">{c.title}</span>
                <span className="actions">
                  <button className="btn-ghost btn-sm btn-icon" aria-label="Modifier" onClick={() => startEdit(c)}>
                    <EditIcon size={15} />
                  </button>
                  <button className="btn-danger btn-sm btn-icon" aria-label="Supprimer" onClick={() => handleDelete(c.id)}>
                    <TrashIcon size={15} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
