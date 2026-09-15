import { createContext, useContext, useState, useCallback } from "react";

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [currentPage, setCurrentPage] = useState(() => {
    if (!localStorage.getItem("trucks_token")) return "login";
    return sessionStorage.getItem("trucks_page") || "login";
  });

  const navigate = useCallback((page) => {
    sessionStorage.setItem("trucks_page", page);
    setCurrentPage(page);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentPage, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNavigation() {
  return useContext(NavigationContext);
}
