import { useState } from 'react';
import TopBar from "./components/TopBar"
import SideBar from './components/Sidebar';
import Inventario from './Inventario';
import ReporteDaño from './ReporteDaño';
import Historial from './Historial';

function AlmaceneroLayout({ currentPage }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "almacenero/reporte-daño":
        return <ReporteDaño />;
      case "almacenero/historial":
        return <Historial />;
      default:
        return <Inventario />;
    }
  };

  return (
    <div className="d-flex min-vh-100">
      <SideBar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} currentPage={currentPage} />
      {menuAbierto && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-md-none" style={{ zIndex: 40, background: "rgba(0,0,0,0.5)" }} onClick={() => setMenuAbierto(false)} />
      )}
      <div className="content-wrapper flex-grow-1 min-w-0">
        <TopBar onToggleMenu={() => setMenuAbierto(true)} />
        <main>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default AlmaceneroLayout;