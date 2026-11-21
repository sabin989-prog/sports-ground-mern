import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from || '/profile'} replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    login.mutate(Object.fromEntries(new FormData(e.currentTarget)));
  };

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <label>Email <input name="email" type="email" required autoComplete="email" /></label>
        <label>Password <input name="password" type="password" required autoComplete="current-password" /></label>
        <ErrorMessage error={login.error} />
        <button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </>
  );
}