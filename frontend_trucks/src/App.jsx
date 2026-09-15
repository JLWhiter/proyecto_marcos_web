import { useEffect } from 'react'
import { useNavigation } from './context/NavigationContext'
import { isAuthenticated } from './api/client'
import Login from './pages/Login'
import EditarPerfil from './pages/EditarPerfil'
import RecepcionistaLayout from './pages/recepcionista/Recepcionistalayout'
import AlmaceneroLayout from './pages/almacenero/Almacenerolayout'
import AdminLayout from './pages/admin/AdminLayout'

function App() {
  const { currentPage, navigate } = useNavigation()

  useEffect(() => {
    if (!isAuthenticated() && currentPage !== "login") {
      navigate("login")
    }
  }, [currentPage, navigate])

  useEffect(() => {
    const onUnauthorized = () => navigate("login");
    window.addEventListener("trucks:unauthorized", onUnauthorized);
    return () => window.removeEventListener("trucks:unauthorized", onUnauthorized);
  }, [navigate])

  if (!isAuthenticated()) {
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
