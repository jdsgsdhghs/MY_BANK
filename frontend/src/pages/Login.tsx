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
      if (err instanceof ApiError) setError('Invalid credentials');
      else setError('Unable to connect. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* Brand panel (desktop) */}
      <aside className="auth-pane" aria-hidden="true">
        <div className="auth-pane__brand">
          <span className="brand__mark">M</span>
          <span className="brand__name">MyBank</span>
        </div>
        <div className="auth-pane__body">
          <h2>Your money, made clear.</h2>
          <p>Track your income and expenses in a simple, clear and secure interface.</p>
          <ul className="auth-pane__points">
            <li><ShieldIcon size={18} /> End-to-end encrypted connection</li>
            <li><WalletIcon size={18} /> Balance and operations in real time</li>
            <li><TrendingUpIcon size={18} /> Categories to help you decide</li>
          </ul>
        </div>
        <div className="auth-pane__foot">Your data stays private. Always.</div>
      </aside>

      {/* Formulaire */}
      <div className="auth-side">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__mark">M</span>
            <span className="brand__name">MyBank</span>
          </div>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to access your operations.</p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <PasswordField
              label="Password"
              id="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-secure">
            <LockIcon size={15} />
            Encrypted connection — your credentials are never shared.
          </div>
          <p className="auth-switch">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
