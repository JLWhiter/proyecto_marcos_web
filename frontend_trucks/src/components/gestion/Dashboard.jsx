import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [valorTotal, setValorTotal] = useState(0);
  const [mayorValor, setMayorValor] = useState([]);
  const [menorRotacion, setMenorRotacion] = useState([]);
  const [obsoletos, setObsoletos] = useState([]);

  useEffect(() => {
    fetch('/api/v1/gestion/dashboard/valor-total').then(r => r.json()).then(setValorTotal);
    fetch('/api/v1/gestion/dashboard/mayor-valor?top=5').then(r => r.json()).then(setMayorValor);
    fetch('/api/v1/gestion/dashboard/menor-rotacion?top=5').then(r => r.json()).then(setMenorRotacion);
    fetch('/api/v1/gestion/dashboard/obsoletos-danados').then(r => r.json()).then(setObsoletos);
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Dashboard</h2>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-bg-primary">
            <div className="card-body">
              <h6>Valor total inventario</h6>
              <h4>{valorTotal}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-bg-success">
            <div className="card-body">
              <h6>Mayor valor</h6>
              <h4>{mayorValor.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-bg-warning">
            <div className="card-body">
              <h6>Menor rotación</h6>
              <h4>{menorRotacion.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-bg-danger">
            <div className="card-body">
              <h6>Obsoletos/Dañados</h6>
              <h4>{obsoletos.length}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header">Artículos con mayor valor</div>
            <ul className="list-group list-group-flush">
              {mayorValor.map(p => (
                <li key={p.id} className="list-group-item">{p.codigo} - {p.descripcion}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header">Artículos obsoletos o dañados</div>
            <ul className="list-group list-group-flush">
              {obsoletos.map(p => (
                <li key={p.id} className="list-group-item">{p.codigo} - {p.descripcion}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
