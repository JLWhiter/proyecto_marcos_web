import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, me as apiMe } from '../api/auth';
import { setSession, clearSession } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearSession();
    let mounted = true;
    const unauthorized = () => {
      if (mounted) {
        clearSession();
        setUser(null);
        setLoading(false);
      }
    };
    window.addEventListener('trucks:unauthorized', unauthorized);
    apiMe()
      .then((res) => {
        if (mounted && res?.data) {
          setSession({ usuario: res.data });
          setUser(res.data);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => {
      mounted = false;
      window.removeEventListener('trucks:unauthorized', unauthorized);
    };
  }, []);

  const login = async (usuario, contrasena) => {
    const res = await apiLogin(usuario, contrasena);
    setSession(res.data);
    setUser(res.data.usuario);
    setLoading(false);
    return res.data;
  };

  const updateUser = (nextUser) => {
    setSession({ usuario: nextUser });
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch { /* sin importar el estado del servidor */ }
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
