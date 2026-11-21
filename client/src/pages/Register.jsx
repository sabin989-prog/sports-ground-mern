import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Register() {
  const { user, register } = useAuth();
  if (user) return <Navigate to="/profile" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    register.mutate(Object.fromEntries(new FormData(e.currentTarget)));
  };

  return (
    <>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <label>Name <input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label>
        <label>Email <input name="email" type="email" required autoComplete="email" /></label>
        <label>Phone <input name="phone" type="tel" required placeholder="9800000000" autoComplete="tel" /></label>
        <label>Password (8+ characters)
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
        </label>
        <label>I am a
          <select name="role" defaultValue="customer">
            <option value="customer">Customer (I want to book)</option>
            <option value="owner">Owner (I list grounds)</option>
          </select>
        </label>
        <ErrorMessage error={register.error} />
        <button type="submit" disabled={register.isPending}>
          {register.isPending ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </>
  );
}