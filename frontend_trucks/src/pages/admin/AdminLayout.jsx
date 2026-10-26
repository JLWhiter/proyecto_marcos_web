import { useState } from 'react';
import TopBar from "./components/TopBar"
import SideBar from './components/Sidebar';
import Dashboard from '../../components/gestion/Dashboard';
import InventarioFisico from '../../components/gestion/InventarioFisico';
import DanosPendientes from '../../components/gestion/DanosPendientes';
import AjustesInventario from '../../components/gestion/AjustesInventario';
import AlertasReposicion from '../../components/gestion/AlertasReposicion';
import Inventario from './Inventario';
import Reporteventas from './Reporteventas';
import PagosPendientes from './PagosPendientes';
import InformeDaños from './InformeDaños';
import GestionUsuarios from './GestionUsuarios';
import Historial from './Historial';

function AdminLayout({ currentPage }) {
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const onBuscar = (v) => setBusqueda(v);

  const renderPage = () => {
    switch (currentPage) {
      case "admin/inventario":
        return <Inventario />;
      case "admin/inventario-fisico":
        return <InventarioFisico />;
      case "admin/danos":
        return <DanosPendientes />;
      case "admin/ajustes":
        return <AjustesInventario />;
      case "admin/alertas":
        return <AlertasReposicion />;
      case "admin/reporteventas":
        return <Reporteventas />;
      case "admin/pagos-pendientes":
        return <PagosPendientes />;
      case "admin/informe-danos":
        return <InformeDaños />;
      case "admin/usuarios":
        return <GestionUsuarios />;
      case "admin/historial":
        return <Historial />;
      default:
        return <Dashboard />;
    }
  };

return (
    <div className="d-flex min-vh-100">
      <SideBar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} currentPage={currentPage} />
      {menuAbierto && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-md-none" style={{ zIndex: 40, background: "rgba(0,0,0,0.5)" }} onClick={() => setMenuAbierto(false)} />
      )}
      <div className="content-wrapper flex-grow-1 min-w-0">
        <TopBar busqueda={busqueda} onBuscar={onBuscar} onToggleMenu={() => setMenuAbierto(true)} />
        <main>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;