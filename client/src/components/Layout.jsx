import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">Sports Ground</Link>
        <nav>
          {user ? (
            <>
              <Link to="/profile">{user.name}</Link>
              <button onClick={() => logout.mutate()} disabled={logout.isPending}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}