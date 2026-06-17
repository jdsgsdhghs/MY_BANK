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
      {/* --- Sidebar (desktop / landscape tablet) --- */}
      <aside className="sidebar">
        <NavLink to="/operations" className="brand">
          <span className="brand__mark">M</span>
          <span className="brand__name">MyBank</span>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <NavLink to="/operations" className={navClass}>
            <WalletIcon size={19} />
            <span>Operations</span>
          </NavLink>
          <NavLink to="/categories" className={navClass}>
            <TagIcon size={19} />
            <span>Categories</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={navClass}>
              <UsersIcon size={19} />
              <span>Users</span>
            </NavLink>
          )}
          <NavLink to="/profile" className={navClass}>
            <UserIcon size={19} />
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <NavLink to="/profile" className="sidebar__user" aria-label="View my profile">
            <span className="sidebar__avatar">{initials}</span>
            <span className="sidebar__user-meta">
              <span className="sidebar__user-email">{user?.email}</span>
              <span className="sidebar__user-role">{isAdmin ? 'Administrator' : 'Personal account'}</span>
            </span>
          </NavLink>
          <div className="sidebar__actions">
            <ThemeToggle />
            <button type="button" className="btn-ghost btn-sm sidebar__logout" onClick={handleLogout}>
              <LogOutIcon size={16} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* --- Top bar (mobile / portrait tablet) --- */}
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
            aria-label="Log out"
            title="Log out"
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

      {/* --- Tab bar (mobile) --- */}
      <nav className="bottom-nav" aria-label="Main mobile navigation">
        <NavLink to="/operations" className={navClass}>
          <WalletIcon size={21} />
          <span>Operations</span>
        </NavLink>
        <NavLink to="/categories" className={navClass}>
          <TagIcon size={21} />
          <span>Categories</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/users" className={navClass}>
            <UsersIcon size={21} />
            <span>Accounts</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={navClass}>
          <UserIcon size={21} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
