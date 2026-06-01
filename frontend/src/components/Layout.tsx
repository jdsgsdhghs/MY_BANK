import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="container layout-header-inner">
          <div className="brand">
            <span className="brand-mark">M</span>
            <span className="brand-name">MyBank</span>
          </div>
          <nav className="layout-nav">
            <NavLink to="/operations" className={({ isActive }) => (isActive ? 'active' : '')}>
              Operations
            </NavLink>
            <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
              Categories
            </NavLink>
            {isAdmin && (
              <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
                Users
              </NavLink>
            )}
          </nav>
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
