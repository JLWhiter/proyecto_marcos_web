import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, me as apiMe } from '../api/auth';
import { setSession, clearSession, getUser, isAuthenticated } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    if (!isAuthenticated()) return;
    apiMe()
      .then((res) => {
        if (res?.data) {
          localStorage.setItem('trucks_user', JSON.stringify(res.data));
          setUser(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const login = async (usuario, contrasena) => {
    const res = await apiLogin(usuario, contrasena);
    setSession(res.data);
    setUser(res.data.usuario);
    return res.data;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch { /* sin importar el estado del servidor */ }
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
