import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LogOutIcon, TagIcon, UserIcon, UsersIcon, WalletIcon } from './icons';
import './Layout.css';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <div className="layout">
      {/* --- Sidebar (desktop / tablette paysage) --- */}
      <aside className="sidebar">
        <NavLink to="/operations" className="brand">
          <span className="brand__mark">M</span>
          <span className="brand__name">MyBank</span>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Navigation principale">
          <NavLink to="/operations" className={navClass}>
            <WalletIcon size={19} />
            <span>Opérations</span>
          </NavLink>
          <NavLink to="/categories" className={navClass}>
            <TagIcon size={19} />
            <span>Catégories</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={navClass}>
              <UsersIcon size={19} />
              <span>Utilisateurs</span>
            </NavLink>
          )}
          <NavLink to="/profile" className={navClass}>
            <UserIcon size={19} />
            <span>Profil</span>
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <NavLink to="/profile" className="sidebar__user" aria-label="Voir mon profil">
            <span className="sidebar__avatar">{initials}</span>
            <span className="sidebar__user-meta">
              <span className="sidebar__user-email">{user?.email}</span>
              <span className="sidebar__user-role">{isAdmin ? 'Administrateur' : 'Compte personnel'}</span>
            </span>
          </NavLink>
          <div className="sidebar__actions">
            <ThemeToggle />
            <button type="button" className="btn-ghost btn-sm sidebar__logout" onClick={handleLogout}>
              <LogOutIcon size={16} />
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      {/* --- Barre supérieure (mobile / tablette portrait) --- */}
      <header className="topbar">
        <NavLink to="/operations" className="brand">
          <span className="brand__mark">M</span>
          <span className="brand__name">MyBank</span>
        </NavLink>
        <div className="topbar__actions">
          <ThemeToggle />
          <button
            type="button"
            className="topbar__logout"
            onClick={handleLogout}
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOutIcon size={18} />
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* --- Barre d'onglets (mobile) --- */}
      <nav className="bottom-nav" aria-label="Navigation principale mobile">
        <NavLink to="/operations" className={navClass}>
          <WalletIcon size={21} />
          <span>Opérations</span>
        </NavLink>
        <NavLink to="/categories" className={navClass}>
          <TagIcon size={21} />
          <span>Catégories</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/users" className={navClass}>
            <UsersIcon size={21} />
            <span>Comptes</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={navClass}>
          <UserIcon size={21} />
          <span>Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}
