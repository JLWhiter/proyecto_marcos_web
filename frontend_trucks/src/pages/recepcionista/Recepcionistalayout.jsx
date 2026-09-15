import { useState } from 'react';
import TopBar from "./components/TopBar"
import SideBar from './components/Sidebar';
import Recepcion from './Recepcion';
import Historial from './Historial';
import Reporteventas from './Reporteventas';

function RecepcionistaLayout({ currentPage }) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const onBuscar = (v) => {
    setBusqueda(v);
    setPagina(1);
  };
  const cambiarPagina = (p) => setPagina(p);

  const renderPage = () => {
    switch (currentPage) {
      case "recepcionista/historial":
        return <Historial />;
      case "recepcionista/reporteventas":
        return <Reporteventas />;
      default:
        return <Recepcion busqueda={busqueda} onBuscar={onBuscar} pagina={pagina} cambiarPagina={cambiarPagina} />;
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

export default RecepcionistaLayout;