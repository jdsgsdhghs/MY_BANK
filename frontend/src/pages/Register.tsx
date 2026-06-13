import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import PasswordField from '../components/PasswordField';
import { LockIcon, ShieldIcon, TrendingUpIcon, WalletIcon } from '../components/icons';
import './Auth.css';

const PW_HINTS = [
  '8 caractères minimum. Mélangez lettres, chiffres et symboles.',
  'Mot de passe faible.',
  'Mot de passe correct.',
  'Bon mot de passe.',
  'Mot de passe robuste.',
];

function passwordScore(v: string): number {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/register', { email, password });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Inscription impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* Panneau de marque (desktop) */}
      <aside className="auth-pane" aria-hidden="true">
        <div className="auth-pane__brand">
          <span className="brand__mark">M</span>
          <span className="brand__name">MyBank</span>
        </div>
        <div className="auth-pane__body">
          <h2>Démarrez en quelques secondes.</h2>
          <p>Un compte gratuit pour suivre votre budget, classer vos dépenses et garder le contrôle.</p>
          <ul className="auth-pane__points">
            <li><ShieldIcon size={18} /> Données chiffrées et stockées en Europe</li>
            <li><WalletIcon size={18} /> Solde net calculé automatiquement</li>
            <li><TrendingUpIcon size={18} /> Catégories personnalisables</li>
          </ul>
        </div>
        <div className="auth-pane__foot">Sans engagement. Sans frais cachés.</div>
      </aside>

      {/* Formulaire */}
      <div className="auth-side">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__mark">M</span>
            <span className="brand__name">MyBank</span>
          </div>
          <h1>Créer un compte</h1>
          <p className="auth-subtitle">Quelques secondes suffisent pour démarrer.</p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <PasswordField
                label="Mot de passe"
                id="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Au moins 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="pw-meter" data-score={password.length === 0 ? 0 : score}>
                <span /><span /><span /><span />
              </div>
              <p className="pw-hint">{PW_HINTS[password.length === 0 ? 0 : score]}</p>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-secure">
            <LockIcon size={15} />
            Vos données sont chiffrées et stockées en Europe.
          </div>
          <p className="auth-switch">
            Déjà inscrit ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
