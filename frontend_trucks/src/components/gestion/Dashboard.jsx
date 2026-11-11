import { useEffect, useState } from 'react';
import { dashboard as apiDashboard } from '../../api/gestion';
import { useNavigation } from '../../context/NavigationContext';

const money = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '$ 0.00';
  return `$ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const num = (v) => Number(v || 0).toLocaleString('es-PE');

function KpiCard({ titulo, valor, detalle, color, icono }) {
  return (
    <div className={`card border-0 shadow-sm h-100 border-start border-4 ${color}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <p className="text-muted text-uppercase fw-bold small mb-1">{titulo}</p>
          {icono && <span className="fs-4">{icono}</span>}
        </div>
        <p className="fs-3 fw-bolder text-dark mb-0">{valor}</p>
        <p className="small text-muted mb-0">{detalle}</p>
      </div>
    </div>
  );
}

function Tabla({ titulo, head, children, vacio, onVer }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center gap-2">
        <h3 className="h6 fw-bold text-uppercase text-secondary mb-0">{titulo}</h3>
        {onVer && <button type="button" className="btn btn-sm btn-outline-primary text-nowrap" onClick={onVer}>Ver lista</button>}
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>{head.map((h) => <th key={h} className="small text-uppercase">{h}</th>)}</tr>
          </thead>
          <tbody>
            {children}
            {!children?.length && (
              <tr><td colSpan={head.length} className="text-center text-muted small py-4">{vacio}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { navigate } = useNavigation();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let activo = true;
    apiDashboard()
      .then((res) => { if (activo) setData(res.data || null); })
      .catch((err) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [refreshTick]);

  const cargar = () => {
    setCargando(true);
    setError('');
    setRefreshTick((tick) => tick + 1);
  };

  const mayorValor = data?.mayorValor || [];
  const menorRotacion = data?.menorRotacion || [];
  const obsoletos = data?.obsoletos || [];
  return (
    <div className="container-fluid py-4 px-4 bg-light min-vh-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bolder mb-1">Dashboard</h2>
          <p className="text-muted mb-0 small">Indicadores de inventario y rotación</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={cargar} disabled={cargando}>
          Actualizar
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {cargando && !data && (
        <div className="alert alert-info">Cargando indicadores...</div>
      )}

      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <KpiCard
                titulo="Valor total del inventario"
                valor={money(data.valorTotal)}
                detalle="Stock actual × costo de compra"
                color="border-primary"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <KpiCard
                titulo="Artículos con mayor valor"
                valor={num(mayorValor.length)}
                detalle={mayorValor[0] ? `Top: ${mayorValor[0].codigo} (${money(mayorValor[0].valor)})` : 'Sin datos'}
                color="border-success" icono="📈"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <KpiCard
                titulo="Artículos con menor rotación"
                valor={num(menorRotacion.length)}
                detalle={data.hayVentasPeriodo
                  ? (menorRotacion[0] ? `Menos vendido: ${menorRotacion[0].codigo} (${num(menorRotacion[0].ventas)} u.)` : 'Sin datos')
                  : 'Sin ventas registradas en el periodo'}
                color="border-warning" icono="🐢"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <KpiCard
                titulo="Obsoletos o dañados"
                valor={num(obsoletos.length)}
                detalle={data.hayVentasPeriodo
                  ? 'Sin ventas durante el periodo o daño confirmado'
                  : (obsoletos.length ? 'Incluye daños confirmados' : 'Sin ventas ni daños confirmados')}
                color="border-danger" icono="⚠️"
              />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-4">
              <Tabla
                titulo="Mayor valor en inventario"
                head={['Código', 'Producto', 'Stock', 'Valor']}
                vacio="Sin productos"
                onVer={() => navigate('admin/inventario')}
              >
                {mayorValor.map((p) => (
                  <tr key={`mv-${p.codigo}`}>
                    <td className="fw-semibold">{p.codigo}</td>
                    <td className="text-truncate" style={{ maxWidth: '12rem' }}>{p.nombre}</td>
                    <td>{num(p.stock)}</td>
                    <td className="fw-bold text-success">{money(p.valor)}</td>
                  </tr>
                ))}
              </Tabla>
            </div>
            <div className="col-12 col-xl-4">
              <Tabla
                titulo="Menor rotación"
                head={['Código', 'Producto', 'Ventas', 'Stock']}
                vacio={data.hayVentasPeriodo ? 'Sin productos' : 'Aún no hay ventas registradas en el periodo'}
                onVer={() => navigate('admin/reporteventas')}
              >
                {menorRotacion.map((p) => (
                  <tr key={`mr-${p.codigo}`}>
                    <td className="fw-semibold">{p.codigo}</td>
                    <td className="text-truncate" style={{ maxWidth: '12rem' }}>{p.nombre}</td>
                    <td><span className="badge text-bg-warning">{num(p.ventas)} u.</span></td>
                    <td>{num(p.stock)}</td>
                  </tr>
                ))}
              </Tabla>
            </div>
            <div className="col-12 col-xl-4">
              <Tabla
                titulo="Obsoletos o dañados"
                head={['Código', 'Producto', 'Stock', 'Motivo']}
                vacio={data.hayVentasPeriodo ? 'Sin productos' : 'Sin ventas ni daños confirmados'}
                onVer={() => navigate('admin/danos')}
              >
                {obsoletos.map((p, i) => (
                  <tr key={`ob-${p.codigo}-${i}`}>
                    <td className="fw-semibold">{p.codigo}</td>
                    <td className="text-truncate" style={{ maxWidth: '12rem' }}>{p.nombre}</td>
                    <td>{num(p.stock)}</td>
                    <td><span className="badge text-bg-danger">{p.motivo}</span></td>
                  </tr>
                ))}
              </Tabla>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
