import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';
import { LockIcon, ShieldIcon, TrendingUpIcon, WalletIcon } from '../components/icons';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string }>('/login', { email, password });
      login(res.token);
      navigate('/operations');
    } catch (err) {
      if (err instanceof ApiError) setError('Identifiants invalides');
      else setError('Connexion impossible. Réessayez plus tard.');
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
          <h2>Votre argent, en toute clarté.</h2>
          <p>Suivez vos revenus et vos dépenses dans une interface simple, lisible et sécurisée.</p>
          <ul className="auth-pane__points">
            <li><ShieldIcon size={18} /> Connexion chiffrée de bout en bout</li>
            <li><WalletIcon size={18} /> Solde et opérations en temps réel</li>
            <li><TrendingUpIcon size={18} /> Des catégories pour mieux décider</li>
          </ul>
        </div>
        <div className="auth-pane__foot">Vos données restent privées. Toujours.</div>
      </aside>

      {/* Formulaire */}
      <div className="auth-side">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__mark">M</span>
            <span className="brand__name">MyBank</span>
          </div>
          <h1>Bonjour, content de vous revoir</h1>
          <p className="auth-subtitle">Connectez-vous pour accéder à vos opérations.</p>

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

            <PasswordField
              label="Mot de passe"
              id="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-secure">
            <LockIcon size={15} />
            Connexion chiffrée — vos identifiants ne sont jamais partagés.
          </div>
          <p className="auth-switch">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
