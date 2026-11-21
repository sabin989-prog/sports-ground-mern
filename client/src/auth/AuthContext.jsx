import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const setUser = (u) => qc.setQueryData(['me'], u);

  const login = useMutation({ mutationFn: authApi.login, onSuccess: setUser });
  const register = useMutation({ mutationFn: authApi.register, onSuccess: setUser });
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' }); // drop the old user's data
    },
  });

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);