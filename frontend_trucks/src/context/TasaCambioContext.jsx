import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTasaCambio } from '../api/reportes';

const TasaCambioContext = createContext(null);

export function TasaCambioProvider({ children }) {
  const [tasa, setTasa] = useState(() => Number(localStorage.getItem('trucks_tasa_cambio')) || 3.4);

  useEffect(() => {
    getTasaCambio()
      .then((res) => {
        const v = Number(res?.data?.tasa_cambio);
        if (v > 0) {
          setTasa(v);
          localStorage.setItem('trucks_tasa_cambio', String(v));
        }
      })
      .catch(() => {});
  }, []);

  const cambiarTasa = useCallback((v) => {
    const num = Number(v) || 0;
    setTasa(num);
    if (num > 0) localStorage.setItem('trucks_tasa_cambio', String(num));
  }, []);

  return (
    <TasaCambioContext.Provider value={{ tasa, cambiarTasa }}>
      {children}
    </TasaCambioContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTasaCambio() {
  return useContext(TasaCambioContext);
}
