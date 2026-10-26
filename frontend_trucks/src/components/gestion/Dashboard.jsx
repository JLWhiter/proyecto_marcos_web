import { useCallback, useEffect, useState } from 'react';
import { dashboard as apiDashboard } from '../../api/gestion';

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
          <span className="fs-4">{icono}</span>
        </div>
        <p className="fs-3 fw-bolder text-dark mb-0">{valor}</p>
        <p className="small text-muted mb-0">{detalle}</p>
      </div>
    </div>
  );
}

function Tabla({ titulo, head, children, vacio }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-0 pt-3">
        <h3 className="h6 fw-bold text-uppercase text-secondary mb-0">{titulo}</h3>
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
  const [periodo, setPeriodo] = useState('mes');
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    apiDashboard(periodo)
      .then((res) => setData(res.data || null))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [periodo]);

  useEffect(() => { cargar(); }, [cargar]);

  const mayorValor = data?.mayorValor || [];
  const menorRotacion = data?.menorRotacion || [];
  const obsoletos = data?.obsoletos || [];
  const etiquetaPeriodo = periodo === 'semana' ? 'últimos 7 días' : 'últimos 30 días';

  return (
    <div className="container-fluid py-4 px-4 bg-light min-vh-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bolder mb-1">Dashboard</h2>
          <p className="text-muted mb-0 small">Indicadores de inventario y rotación · {etiquetaPeriodo}</p>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="mes">Mensual (30 días)</option>
            <option value="semana">Semanal (7 días)</option>
          </select>
          <button className="btn btn-outline-secondary" onClick={cargar} disabled={cargando}>
            Actualizar
          </button>
        </div>
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
                color="border-primary" icono="💰"
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
                detalle={menorRotacion[0] ? `Menos vendido: ${menorRotacion[0].codigo} (${num(menorRotacion[0].ventas)} u.)` : 'Sin datos'}
                color="border-warning" icono="🐢"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <KpiCard
                titulo="Obsoletos o dañados"
                valor={num(obsoletos.length)}
                detalle="Sin ventas en el periodo o daño confirmado"
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
                titulo={`Menor rotación (${etiquetaPeriodo})`}
                head={['Código', 'Producto', 'Ventas', 'Stock']}
                vacio="Sin productos"
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
                vacio="Sin productos"
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
