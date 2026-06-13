import { FormEvent, useState } from 'react';
import { api, ApiError, Profile as ProfileData } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';
import { CheckIcon, InfoIcon, LockIcon, UserIcon } from '../components/icons';
import './Profile.css';

export default function Profile() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = !!user?.roles?.includes('ROLE_ADMIN');
  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const emailChanged = trimmedEmail !== (user?.email ?? '');
    const wantsPasswordChange = password.length > 0;

    if (!trimmedEmail) {
      setError('L\'adresse e-mail est requise');
      return;
    }
    if (!emailChanged && !wantsPasswordChange) {
      setError('Aucune modification à enregistrer');
      return;
    }
    if (wantsPasswordChange) {
      if (password.length < 8) {
        setError('Le nouveau mot de passe doit comporter au moins 8 caractères');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }
    if (!currentPassword) {
      setError('Veuillez saisir votre mot de passe actuel pour confirmer');
      return;
    }

    const payload: Record<string, unknown> = { currentPassword };
    if (emailChanged) payload.email = trimmedEmail;
    if (wantsPasswordChange) payload.password = password;

    setSubmitting(true);
    try {
      const res = await api.put<ProfileData & { token: string }>('/profile', payload);
      login(res.token);
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Vos modifications ont été enregistrées.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>Profil</h2>
        <p className="subtitle">Gérez votre identité et votre mot de passe.</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-head__id">
            <span className="profile-head__email">{user?.email}</span>
            <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
              {isAdmin ? 'Administrateur' : 'Utilisateur'}
            </span>
          </div>
        </div>

        {success && (
          <div className="alert alert-success" role="status" aria-live="polite" style={{ marginBottom: 18 }}>
            <CheckIcon size={16} className="alert-icon" />
            {success}
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-section">
            <div className="profile-section__title">
              <UserIcon size={15} />
              Identité
            </div>
            <div className="field">
              <label htmlFor="profile-email">Adresse e-mail</label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section__title">
              <LockIcon size={15} />
              Mot de passe
            </div>
            <PasswordField
              label="Nouveau mot de passe"
              id="profile-new-password"
              autoComplete="new-password"
              minLength={8}
              placeholder="Laisser vide pour ne pas changer"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordField
              label="Confirmation"
              id="profile-confirm-password"
              autoComplete="new-password"
              placeholder="Retapez le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="confirm-current">
              <div className="note">
                <InfoIcon size={15} />
                Pour toute modification, confirmez votre mot de passe actuel.
              </div>
              <PasswordField
                label="Mot de passe actuel"
                id="profile-current-password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
