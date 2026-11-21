import { useAuth } from '../auth/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  return (
    <>
      <h1>Your profile</h1>
      <dl>
        <dt>Name</dt><dd>{user.name}</dd>
        <dt>Email</dt><dd>{user.email}</dd>
        <dt>Phone</dt><dd>{user.phone}</dd>
        <dt>Role</dt><dd>{user.role}</dd>
      </dl>
    </>
  );
}