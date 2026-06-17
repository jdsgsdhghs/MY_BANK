import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import PasswordField from '../components/PasswordField';
import { LockIcon, ShieldIcon, TrendingUpIcon, WalletIcon } from '../components/icons';
import './Auth.css';

const PW_HINTS = [
  'At least 8 characters. Mix letters, numbers and symbols.',
  'Weak password.',
  'Fair password.',
  'Good password.',
  'Strong password.',
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
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/register', { email, password });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not sign up.');
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
          <h2>Get started in seconds.</h2>
          <p>A free account to track your budget, categorize your spending and stay in control.</p>
          <ul className="auth-pane__points">
            <li><ShieldIcon size={18} /> Data encrypted and stored in Europe</li>
            <li><WalletIcon size={18} /> Net balance calculated automatically</li>
            <li><TrendingUpIcon size={18} /> Customizable categories</li>
          </ul>
        </div>
        <div className="auth-pane__foot">No commitment. No hidden fees.</div>
      </aside>

      {/* Form */}
      <div className="auth-side">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__mark">M</span>
            <span className="brand__name">MyBank</span>
          </div>
          <h1>Create an account</h1>
          <p className="auth-subtitle">It only takes a few seconds to get started.</p>

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

            <div>
              <PasswordField
                label="Password"
                id="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="pw-meter" data-score={password.length === 0 ? 0 : score}>
                <span /><span /><span /><span />
              </div>
              <p className="pw-hint">{PW_HINTS[password.length === 0 ? 0 : score]}</p>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create my account'}
            </button>
          </form>

          <div className="auth-secure">
            <LockIcon size={15} />
            Your data is encrypted and stored in Europe.
          </div>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
