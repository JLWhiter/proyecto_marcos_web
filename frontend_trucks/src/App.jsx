import { useEffect } from 'react'
import { useNavigation } from './context/NavigationContext'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import EditarPerfil from './pages/EditarPerfil'
import RecepcionistaLayout from './pages/recepcionista/Recepcionistalayout'
import AlmaceneroLayout from './pages/almacenero/Almacenerolayout'
import AdminLayout from './pages/admin/AdminLayout'

function App() {
  const { currentPage, navigate } = useNavigation()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user && currentPage !== "login") {
      navigate("login")
    }
    if (!loading && user && currentPage === "login") {
      const rol = user.rol_nombre;
      if (rol === "Administrador") navigate("admin/dashboard");
      else if (rol === "Almacenamiento") navigate("almacenero/inventario");
      else navigate("recepcionista/recepcion");
    }
  }, [currentPage, loading, navigate, user])

  useEffect(() => {
    const onUnauthorized = () => navigate("login");
    window.addEventListener("trucks:unauthorized", onUnauthorized);
    return () => window.removeEventListener("trucks:unauthorized", onUnauthorized);
  }, [navigate])

  if (loading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center text-muted">Verificando sesión...</div>
  }

  if (!user) {
    return <Login />
  }

  if (currentPage === "editar-perfil") {
    return <EditarPerfil />
  }

  if (currentPage.startsWith("recepcionista")) {
    return <RecepcionistaLayout currentPage={currentPage} />
  }

  if (currentPage.startsWith("almacenero")) {
    return <AlmaceneroLayout currentPage={currentPage} />
  }

  if (currentPage.startsWith("admin")) {
    return <AdminLayout currentPage={currentPage} />
  }

  return <Login />
}

export default App
