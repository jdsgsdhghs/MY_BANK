import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, Category, Operation } from '../api/client';
import TouchableOpacity from '../components/TouchableOpacity';
import './Operations.css';

interface FormState {
  id: number | null;
  label: string;
  amount: string;
  date: string;
  categoryId: string;
}

const emptyForm: FormState = {
  id: null,
  label: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  categoryId: '',
};

export default function Operations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [ops, cats] = await Promise.all([api.get<Operation[]>('/operations'), api.get<Category[]>('/categories')]);
      setOperations(ops);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      label: form.label,
      amount: form.amount,
      date: form.date,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
    try {
      if (form.id) {
        await api.put(`/operations/${form.id}`, payload);
      } else {
        await api.post('/operations', payload);
      }
      setForm(emptyForm);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  function startEdit(op: Operation) {
    setForm({
      id: op.id,
      label: op.label,
      amount: op.amount,
      date: op.date.slice(0, 10),
      categoryId: op.category ? String(op.category.id) : '',
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this operation?')) return;
    try {
      await api.delete(`/operations/${id}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  const total = operations.reduce((s, o) => s + Number(o.amount), 0);

  return (
    <div className="operations">
      <header className="page-header">
        <div>
          <h2>Operations</h2>
          <p className="muted">Track your income and expenses.</p>
        </div>
        <div className="summary card">
          <span className="summary-label">Net total</span>
          <span className="summary-value">{total.toFixed(2)} €</span>
        </div>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <section className="card form-card">
        <h3>{form.id ? 'Edit operation' : 'New operation'}</h3>
        <form onSubmit={handleSubmit} className="op-form">
          <div className="field">
            <label htmlFor="op-label">Label</label>
            <input
              id="op-label"
              required
              maxLength={150}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="op-amount">Amount</label>
            <input
              id="op-amount"
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="op-date">Date</label>
            <input
              id="op-date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="op-cat">Category</label>
            <select
              id="op-cat"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {form.id ? 'Update' : 'Add'}
            </button>
            {form.id && (
              <button type="button" className="btn-ghost" onClick={() => setForm(emptyForm)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card list-card">
        <h3>History</h3>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : operations.length === 0 ? (
          <p className="muted">No operations yet. Add your first one above.</p>
        ) : (
          <div className="op-table-wrap">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Label</th>
                  <th>Category</th>
                  <th className="num">Amount</th>
                  <th className="actions" aria-label="actions"></th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id}>
                    <td>{op.date.slice(0, 10)}</td>
                    <td>{op.label}</td>
                    <td>{op.category?.title ?? '—'}</td>
                    <td className={`num ${Number(op.amount) < 0 ? 'negative' : 'positive'}`}>
                      {Number(op.amount).toFixed(2)} €
                    </td>
                    <td className="actions">
                      <TouchableOpacity variant="ghost" onClick={() => startEdit(op)}>
                        Edit
                      </TouchableOpacity>
                      <TouchableOpacity variant="danger" onClick={() => handleDelete(op.id)}>
                        Delete
                      </TouchableOpacity>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
