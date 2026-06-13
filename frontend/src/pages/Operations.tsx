import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, Category, Operation } from '../api/client';
import { ArrowDownLeftIcon, ArrowUpRightIcon, EditIcon, ListIcon, TrashIcon } from '../components/icons';
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

/* Montant signé, format français, espace insécable avant l'euro. */
function formatAmount(n: number): string {
  const sign = n >= 0 ? '+' : '−';
  const body = Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${body}${String.fromCharCode(160)}€`;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).split('-').reverse().slice(0, 2).join('/');
}

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
      setError(err instanceof ApiError ? err.message : 'Chargement des données impossible');
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
      setError(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
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
    if (!confirm('Supprimer cette opération ?')) return;
    try {
      await api.delete(`/operations/${id}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de la suppression');
    }
  }

  const total = operations.reduce((s, o) => s + Number(o.amount), 0);
  const credits = operations.reduce((s, o) => (Number(o.amount) > 0 ? s + Number(o.amount) : s), 0);
  const debits = operations.reduce((s, o) => (Number(o.amount) < 0 ? s + Number(o.amount) : s), 0);

  return (
    <div className="operations">
      <div className="page-header">
        <h2>Opérations</h2>
        <p className="subtitle">Suivez vos revenus et vos dépenses, mois par mois.</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {/* Carte solde — héro */}
      <div className="summary" role="group" aria-label="Solde net">
        <div className="summary__main">
          <div className="summary__label">Solde net</div>
          <div className="summary__value amount amount-lg">{formatAmount(total)}</div>
          <div className="summary__meta">{operations.length} opération{operations.length > 1 ? 's' : ''} enregistrée{operations.length > 1 ? 's' : ''}</div>
        </div>
        <div className="summary__breakdown">
          <div className="summary__stat">
            <span className="summary__stat-ico credit"><ArrowUpRightIcon size={15} /></span>
            <div>
              <div className="k">Crédits</div>
              <div className="v amount">{formatAmount(credits)}</div>
            </div>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-ico debit"><ArrowDownLeftIcon size={15} /></span>
            <div>
              <div className="k">Débits</div>
              <div className="v amount">{formatAmount(debits)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="card">
        <div className="card-title">{form.id ? "Modifier l'opération" : 'Nouvelle opération'}</div>
        <form className="operation-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="op-label">Libellé</label>
            <input
              id="op-label"
              type="text"
              required
              maxLength={150}
              placeholder="ex. Courses, Salaire…"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="op-amount">Montant (€)</label>
            <input
              id="op-amount"
              type="number"
              step="0.01"
              required
              className="input-amount"
              placeholder="0,00"
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
            <label htmlFor="op-cat">Catégorie</label>
            <select
              id="op-cat"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="field field-submit">
            <button type="submit" className="btn-primary">
              {form.id ? 'Mettre à jour' : "Ajouter l'opération"}
            </button>
            {form.id && (
              <button type="button" className="btn-ghost" onClick={() => setForm(emptyForm)}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Historique */}
      <div className="card">
        <div className="card-title">Historique</div>

        {loading ? (
          <div className="table-wrap">
            <table className="operations">
              <thead>
                <tr>
                  <th className="col-date">Date</th>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th className="col-amount">Montant</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr className="op-skel-row" key={i}>
                    <td><span className="skeleton skeleton-line" style={{ width: 48, display: 'inline-block' }} /></td>
                    <td>
                      <div className="op-skel-cell">
                        <span className="skeleton" style={{ width: 32, height: 32, borderRadius: 9 }} />
                        <span className="skeleton skeleton-line" style={{ width: 140, display: 'inline-block' }} />
                      </div>
                    </td>
                    <td><span className="skeleton skeleton-line" style={{ width: 84, display: 'inline-block' }} /></td>
                    <td className="col-amount"><span className="skeleton skeleton-line" style={{ width: 78, display: 'inline-block' }} /></td>
                    <td className="col-actions"><span className="skeleton skeleton-line" style={{ width: 58, display: 'inline-block' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : operations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ListIcon size={24} /></div>
            <h3>Aucune opération pour l'instant</h3>
            <p>Ajoutez votre première opération avec le formulaire ci-dessus pour voir votre solde évoluer.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="operations">
              <thead>
                <tr>
                  <th className="col-date">Date</th>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th className="col-amount">Montant</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => {
                  const value = Number(op.amount);
                  const credit = value >= 0;
                  return (
                    <tr key={op.id}>
                      <td className="col-date" data-th="Date"><span className="op-date">{formatDate(op.date)}</span></td>
                      <td data-th="Libellé">
                        <div className="op-label">
                          <span className={`op-ico ${credit ? 'credit' : 'debit'}`}>
                            {credit ? <ArrowUpRightIcon size={16} /> : <ArrowDownLeftIcon size={16} />}
                          </span>
                          <span className="op-label__main">{op.label}</span>
                        </div>
                      </td>
                      <td data-th="Catégorie">
                        {op.category ? (
                          <span className="op-category">{op.category.title}</span>
                        ) : (
                          <span className="op-category none">Sans catégorie</span>
                        )}
                      </td>
                      <td className="col-amount" data-th="Montant">
                        <span className={`amount ${credit ? 'amount-credit' : 'amount-debit'}`}>{formatAmount(value)}</span>
                      </td>
                      <td className="col-actions" data-th="Actions">
                        <div className="op-actions">
                          <button className="btn-ghost btn-sm btn-icon" aria-label="Modifier" onClick={() => startEdit(op)}>
                            <EditIcon size={15} />
                          </button>
                          <button className="btn-danger btn-sm btn-icon" aria-label="Supprimer" onClick={() => handleDelete(op.id)}>
                            <TrashIcon size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
